from __future__ import annotations
"""
Google Maps Scraper — Headless Playwright.

Deep-scrape mode
────────────────
Google Maps caps each search at ~120 results.  To get ALL businesses in a
city we split the area into a grid (e.g. 3×3 = 9 zones), run a separate
search in each zone, then de-duplicate.  This routinely returns 300-1 000+
unique leads per city.

Flow
────
1. Launch hidden Chromium
2. First search → detect city centre coordinates
3. Build a grid of lat/lng points around that centre
4. For each grid cell: navigate → scroll → collect listing URLs
5. Visit every unique listing → extract details
6. Return de-duplicated list of Lead objects
"""

import asyncio
import math
import random
import re
from urllib.parse import quote_plus

from playwright.async_api import (
    async_playwright,
    Page,
    TimeoutError as PwTimeout,
)
from rich.console import Console
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    MofNCompleteColumn,
    TimeElapsedColumn,
)

from models import Lead
import config

console = Console()

# ─── Selectors ───────────────────────────────────────────────────────
SEL_SEARCHBOX = "input[name='q']"
SEL_FEED = "[role='feed']"
SEL_LISTING = "a[href*='/maps/place/']"
SEL_END = "span.HlvSq"
SEL_NAME = "h1.DUwDvf"
SEL_CATEGORY = "button.DkEaL"
SEL_RATING = "div.F7nice span[aria-hidden='true']"
SEL_REVIEW = "div.F7nice span[aria-label*='review']"
SEL_PRICE = "span[aria-label*='Price']"
SEL_INFO_BTN = "button[data-item-id]"
SEL_INFO_LINK = "a[data-item-id]"


# ═══════════════════════════════════════════════════════════════════════
#  Grid helpers
# ═══════════════════════════════════════════════════════════════════════

def _build_grid(centre_lat: float, centre_lng: float) -> list[tuple[float, float]]:
    """Create a grid of (lat, lng) points around the city centre."""
    n = config.GRID_SIZE
    r_km = config.GRID_RADIUS_KM

    # 1° latitude  ≈ 111 km
    # 1° longitude ≈ 111 km × cos(lat)
    lat_step = (r_km * 2 / n) / 111.0
    lng_step = (r_km * 2 / n) / (111.0 * math.cos(math.radians(centre_lat)))

    points: list[tuple[float, float]] = []
    start_lat = centre_lat - (n - 1) / 2 * lat_step
    start_lng = centre_lng - (n - 1) / 2 * lng_step

    for row in range(n):
        for col in range(n):
            lat = round(start_lat + row * lat_step, 6)
            lng = round(start_lng + col * lng_step, 6)
            points.append((lat, lng))

    return points


def _extract_coords_from_url(url: str) -> tuple[float, float] | None:
    """Pull @lat,lng from a Google Maps URL."""
    m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None


# ═══════════════════════════════════════════════════════════════════════
#  Scraper
# ═══════════════════════════════════════════════════════════════════════

class GoogleMapsScraper:

    URL = "https://www.google.com/maps"

    def __init__(self):
        self.leads: list[Lead] = []
        self._seen_keys: set[str] = set()
        self._seen_hrefs: set[str] = set()
        self._write_lock = asyncio.Lock()

    # ──────────────────────────────────────────────────────────────────
    #  Public: deep scrape (grid-based)
    # ──────────────────────────────────────────────────────────────────

    async def deep_scrape(self, niche: str, city: str) -> list[Lead]:
        """
        Scrape the ENTIRE city by dividing it into grid zones.
        """
        query = f"{niche} in {city}"
        grid_n = config.GRID_SIZE
        total_zones = grid_n * grid_n

        console.print(f"\n[bold cyan]🔍 Deep Scraping:[/] [yellow]{query}[/]")
        console.print(
            f"[dim]   Grid: {grid_n}×{grid_n} = {total_zones} zones  "
            f"| Radius: {config.GRID_RADIUS_KM} km  "
            f"| Zoom: {config.GRID_ZOOM}[/]\n"
        )

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=config.HEADLESS)
            ctx = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
            )
            page = await ctx.new_page()
            page.set_default_timeout(config.BROWSER_TIMEOUT)

            try:
                # ── Step 1: First search to find city centre ─────────
                await self._open(page)
                await self._search(page, query)
                centre = _extract_coords_from_url(page.url)

                if not centre:
                    console.print("[yellow]  ⚠ Could not detect city centre, using single search.[/]")
                    hrefs = await self._scroll_and_collect(page)
                    await self._extract_all(page, hrefs)
                else:
                    lat, lng = centre
                    console.print(f"[dim]  → City centre: {lat}, {lng}[/]")

                    # ── Step 2: Collect hrefs from first search ──────
                    first_hrefs = await self._scroll_and_collect(page)
                    for h in first_hrefs:
                        self._seen_hrefs.add(h)

                    # ── Step 3: Grid search ──────────────────────────
                    grid = _build_grid(lat, lng)
                    console.print(
                        f"\n[bold]  → Searching {total_zones} grid zones…[/]\n"
                    )

                    with Progress(
                        SpinnerColumn(),
                        TextColumn("[progress.description]{task.description}"),
                        BarColumn(),
                        MofNCompleteColumn(),
                        TimeElapsedColumn(),
                        console=console,
                    ) as prog:
                        task = prog.add_task("Grid zones…", total=total_zones)

                        for zi, (glat, glng) in enumerate(grid):
                            zone_query = quote_plus(f"{niche} in {city}")
                            zone_url = (
                                f"https://www.google.com/maps/search/"
                                f"{zone_query}/"
                                f"@{glat},{glng},{config.GRID_ZOOM}z"
                            )
                            try:
                                await page.goto(zone_url, wait_until="domcontentloaded", timeout=20_000)
                                await asyncio.sleep(config.ZONE_PAUSE_SECONDS)

                                # Scroll this zone
                                zone_hrefs = await self._scroll_and_collect(page, silent=True)
                                new = sum(1 for h in zone_hrefs if h not in self._seen_hrefs)
                                for h in zone_hrefs:
                                    self._seen_hrefs.add(h)

                                prog.update(
                                    task, completed=zi + 1,
                                    description=f"Zone {zi+1}: +{new} new  (total {len(self._seen_hrefs)})",
                                )
                            except Exception:
                                prog.update(task, completed=zi + 1,
                                            description=f"[red]Zone {zi+1} failed[/]")

                    console.print(
                        f"\n[bold]  → {len(self._seen_hrefs)} total unique listings across all zones[/]\n"
                    )

                    # ── Step 4: Extract details from ALL listings ────
                    all_hrefs = list(self._seen_hrefs)
                    if len(all_hrefs) > config.MAX_LEADS_PER_SEARCH:
                        all_hrefs = all_hrefs[: config.MAX_LEADS_PER_SEARCH]

                    await self._extract_all(page, all_hrefs)

            except Exception as e:
                console.print(f"[bold red]❌ Error: {e}[/]")
            finally:
                await browser.close()

        console.print(
            f"\n[bold green]✅ Deep scrape complete — {len(self.leads)} unique leads[/]\n"
        )
        return self.leads

    # ──────────────────────────────────────────────────────────────────
    #  Public: single search (quick mode)
    # ──────────────────────────────────────────────────────────────────

    async def scrape(self, query: str) -> list[Lead]:
        console.print(f"\n[bold cyan]🔍 Searching:[/] [yellow]{query}[/]\n")

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=config.HEADLESS)
            ctx = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
            )
            page = await ctx.new_page()
            page.set_default_timeout(config.BROWSER_TIMEOUT)

            try:
                await self._open(page)
                await self._search(page, query)
                hrefs = await self._scroll_and_collect(page)
                await self._extract_all(page, hrefs)
            except Exception as e:
                console.print(f"[bold red]❌ Error: {e}[/]")
            finally:
                await browser.close()

        console.print(f"\n[bold green]✅ Scraped {len(self.leads)} unique leads[/]\n")
        return self.leads

    # ══════════════════════════════════════════════════════════════════
    #  Internal steps
    # ══════════════════════════════════════════════════════════════════

    @staticmethod
    def _lead_key(lead: Lead) -> str:
        if lead.place_id:
            return f"pid:{lead.place_id}"
        if lead.google_maps_url:
            return f"url:{lead.google_maps_url}"
        name = (lead.name or "").strip().lower()
        phone = (lead.phone or "").strip().lower()
        address = (lead.address or "").strip().lower()
        return f"{name}|{phone}|{address}"

    async def _open(self, page: Page):
        console.print("[dim]  → Opening Google Maps (headless)…[/]")
        await page.goto(self.URL, wait_until="networkidle", timeout=30_000)
        await asyncio.sleep(2)

        for sel in [
            "button:has-text('Accept all')",
            "button:has-text('Reject all')",
            "button:has-text('Accept')",
            "form[action*='consent'] button",
            "[aria-label='Accept all']",
            "button:has-text('I agree')",
        ]:
            try:
                btn = page.locator(sel)
                if await btn.count() > 0:
                    await btn.first.click()
                    console.print("[dim]  → Accepted consent dialog[/]")
                    await asyncio.sleep(2)
                    break
            except Exception:
                continue

    async def _search(self, page: Page, query: str):
        console.print("[dim]  → Searching…[/]")

        for attempt in range(3):
            try:
                await page.wait_for_selector(SEL_SEARCHBOX, timeout=15_000)
                break
            except PwTimeout:
                if attempt < 2:
                    console.print("[yellow]  ⚠ Retrying…[/]")
                    await page.goto(self.URL, wait_until="networkidle", timeout=30_000)
                    await asyncio.sleep(3)
                else:
                    raise Exception("Search box not found after 3 attempts")

        box = page.locator(SEL_SEARCHBOX)
        await box.click()
        await box.fill(query)
        await page.keyboard.press("Enter")
        await asyncio.sleep(3)

        try:
            await page.wait_for_selector(SEL_FEED, timeout=15_000)
        except PwTimeout:
            await asyncio.sleep(5)

    async def _scroll_and_collect(self, page: Page, silent: bool = False) -> list[str]:
        if not silent:
            console.print("[dim]  → Scrolling to load all results…[/]")

        feed = page.locator(SEL_FEED)
        if await feed.count() == 0:
            feed = page.locator("div.m6QErb.DxyBCb.kA9KIf.dS8AEf")
        if await feed.count() == 0:
            return []

        prev, stale = 0, 0

        for _ in range(config.MAX_SCROLLS):
            try:
                await feed.evaluate("el => el.scrollTop = el.scrollHeight")
            except Exception:
                break
            await asyncio.sleep(config.SCROLL_PAUSE)

            cur = await page.locator(SEL_LISTING).count()

            if await page.locator(SEL_END).count() > 0:
                break
            if cur >= config.MAX_LEADS_PER_SEARCH:
                break
            if cur == prev:
                stale += 1
                if stale >= 5:
                    break
            else:
                stale = 0
            prev = cur

        hrefs = await page.eval_on_selector_all(
            SEL_LISTING,
            """(nodes) => {
              const out = [];
              const seen = new Set();
              for (const n of nodes) {
                const href = n.getAttribute("href") || "";
                if (href && !seen.has(href)) {
                  seen.add(href);
                  out.push(href);
                }
              }
              return out;
            }""",
        )

        if not silent:
            console.print(f"[dim]  → {len(hrefs)} listings found[/]")
        return hrefs

    async def _extract_all(self, page: Page, hrefs: list[str]):
        console.print(f"[dim]  → Extracting details for {len(hrefs)} listings…[/]")
        if not hrefs:
            return

        # Reuse the page's existing browser context and parallelize detail pages.
        context = page.context
        workers = max(1, min(config.DETAIL_WORKERS, len(hrefs)))
        chunks = [hrefs[i::workers] for i in range(workers)]
        state = {"done": 0}

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            console=console,
        ) as prog:
            task = prog.add_task(f"Extracting with {workers} workers…", total=len(hrefs))
            jobs = [
                self._extract_worker(context, chunk, prog, task, state)
                for chunk in chunks
                if chunk
            ]
            await asyncio.gather(*jobs)

    async def _extract_worker(
        self,
        context,
        hrefs: list[str],
        prog: Progress,
        task: int,
        state: dict[str, int],
    ):
        worker_page = await context.new_page()
        worker_page.set_default_timeout(config.BROWSER_TIMEOUT)
        try:
            for href in hrefs:
                lead_name = ""
                try:
                    await worker_page.goto(href, wait_until="domcontentloaded", timeout=20_000)
                    await asyncio.sleep(
                        random.uniform(config.DETAIL_DELAY_MIN, config.DETAIL_DELAY_MAX)
                    )
                    lead = await self._extract_one(worker_page, href)
                    if lead and lead.name:
                        lead_name = lead.name
                        key = self._lead_key(lead)
                        async with self._write_lock:
                            if key not in self._seen_keys:
                                self._seen_keys.add(key)
                                self.leads.append(lead)
                except Exception:
                    pass
                finally:
                    async with self._write_lock:
                        state["done"] += 1
                        if lead_name:
                            prog.update(
                                task,
                                completed=state["done"],
                                description=f"✔ {lead_name[:40]}",
                            )
                        else:
                            prog.update(task, completed=state["done"])
        finally:
            await worker_page.close()

    async def _extract_one(self, page: Page, url: str) -> Lead | None:
        lead = Lead(google_maps_url=url)
        try:
            try:
                await page.wait_for_selector(SEL_NAME, timeout=8_000)
            except PwTimeout:
                return None

            el = page.locator(SEL_NAME)
            if await el.count():
                lead.name = (await el.first.inner_text()).strip()

            el = page.locator(SEL_CATEGORY)
            if await el.count():
                lead.category = (await el.first.inner_text()).strip()

            el = page.locator(SEL_RATING)
            if await el.count():
                try:
                    lead.rating = float((await el.first.inner_text()).strip())
                except ValueError:
                    pass

            el = page.locator(SEL_REVIEW)
            if await el.count():
                label = (await el.first.get_attribute("aria-label")) or ""
                nums = re.findall(r"[\d,]+", label)
                if nums:
                    lead.review_count = int(nums[0].replace(",", ""))

            el = page.locator(SEL_PRICE)
            if await el.count():
                lead.price_range = (await el.first.inner_text()).strip()

            btns = page.locator(SEL_INFO_BTN)
            for j in range(await btns.count()):
                btn = btns.nth(j)
                iid = (await btn.get_attribute("data-item-id")) or ""
                aria = (await btn.get_attribute("aria-label")) or ""
                text = aria.strip()

                if iid.startswith("address") or "address" in iid:
                    lead.address = text.replace("Address: ", "")
                elif iid.startswith("phone") or "phone" in iid:
                    lead.phone = text.replace("Phone: ", "")
                elif iid.startswith("authority"):
                    lead.website = text.replace("Website: ", "")
                elif iid.startswith("oh"):
                    lead.hours = text

            if not lead.website:
                el = page.locator(SEL_INFO_LINK)
                for j in range(await el.count()):
                    link = el.nth(j)
                    iid = (await link.get_attribute("data-item-id")) or ""
                    if iid.startswith("authority"):
                        lead.website = (await link.get_attribute("href")) or ""
                        break

            pid = re.search(r"place/([^/]+)", url)
            if pid:
                lead.place_id = pid.group(1)

            coords = re.findall(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
            if coords:
                lead.latitude = float(coords[0][0])
                lead.longitude = float(coords[0][1])

            return lead
        except Exception:
            return None


# ═══════════════════════════════════════════════════════════════════════
#  Convenience wrappers
# ═══════════════════════════════════════════════════════════════════════

async def scrape_google_maps(query: str) -> list[Lead]:
    """Single search (quick)."""
    scraper = GoogleMapsScraper()
    return await scraper.scrape(query)


async def deep_scrape_google_maps(niche: str, city: str) -> list[Lead]:
    """Grid-based deep scrape — covers the entire city."""
    scraper = GoogleMapsScraper()
    return await scraper.deep_scrape(niche, city)
