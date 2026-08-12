from __future__ import annotations
"""
Google Maps Scraper — Headless Playwright.
"""

import asyncio
import math
import os
import random
import re
import sys
from pathlib import Path
from urllib.parse import quote_plus

# Cursor / sandbox often points Playwright at an empty cache. Prefer the
# real user browser install so Chromium can launch.
_browsers = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "")
if (not _browsers) or ("cursor-sandbox-cache" in _browsers):
    home = Path.home()
    if sys.platform == "darwin":
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(
            home / "Library" / "Caches" / "ms-playwright"
        )
    elif sys.platform == "win32":
        local = os.environ.get("LOCALAPPDATA") or str(home / "AppData" / "Local")
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(Path(local) / "ms-playwright")
    else:
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(home / ".cache" / "ms-playwright")

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

console = Console(stderr=True)

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

# Google's anti-bot pages. When detected, the scrape must FAIL (not silently
# return zero leads) so the app can tell the user instead of showing an empty
# result they assume means "no businesses here".
CAPTCHA_HINTS = (
    "unusual traffic",
    "recaptcha",
    "are you a robot",
    "not a robot",
    "verify you are human",
    "security check",
    "our systems have detected",
    "enter the characters you see",
)


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


def _extract_cid(url: str) -> str:
    """Best-effort real place id (0x…:0x… hex pair in the URL).

    This is unique per business, unlike the name slug, so it is the strongest
    dedup signal across different queries / zoom levels of the same listing.
    """
    m = re.search(r"0x[0-9a-f]{4,}:0x[0-9a-f]{4,}", url, re.IGNORECASE)
    return m.group(0) if m else ""


def _canonical_maps_url(url: str) -> str:
    """Stable version of a maps place URL for dedup / identity matching.

    Drops the zoom component and the /data= blob (which contains viewport
    state) but keeps the place slug + @lat,lng so the URL still navigates and
    the same business always produces the same string.
    """
    if not url:
        return ""
    u = url.strip()
    u = re.sub(r"@(-?\d+\.\d+,-?\d+\.\d+),\d+(?:\.\d+)?z", r"@\1", u)
    u = re.sub(r"(?:/|&)data=[^&/?]+", "", u)
    return u.rstrip("/")


# ═══════════════════════════════════════════════════════════════════════
#  Scraper
# ═══════════════════════════════════════════════════════════════════════

class GoogleMapsScraper:

    URL = "https://www.google.com/maps"

    def __init__(self):
        self.leads: list[Lead] = []
        self._seen_keys: set[str] = set()
        self._seen_hrefs: set[str] = set()
        self._seen_canon: set[str] = set()
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
                if await self._looks_blocked(page):
                    raise RuntimeError(
                        "Google served a captcha / unusual-traffic page during the deep scrape. "
                        "Wait a few minutes before retrying."
                    )
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

    async def scrape(self, query: str, max_leads: int | None = None) -> list[Lead]:
        console.print(f"\n[bold cyan]🔍 Searching:[/] [yellow]{query}[/]\n")
        cap = max(1, min(max_leads or config.MAX_LEADS_PER_SEARCH, config.MAX_LEADS_PER_SEARCH))

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
                # Direct search URL is more reliable than typing into the box.
                search_url = f"https://www.google.com/maps/search/{quote_plus(query)}"
                console.print("[dim]  → Opening search results (headless)…[/]")
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30_000)
                await asyncio.sleep(2.5)
                await self._dismiss_consent(page)
                await asyncio.sleep(1.5)
                try:
                    await page.wait_for_selector(SEL_FEED, timeout=12_000)
                except PwTimeout:
                    await asyncio.sleep(3)

                if await self._looks_blocked(page):
                    raise RuntimeError(
                        "Google served a captcha / unusual-traffic page. "
                        "Wait a few minutes before retrying."
                    )

                # Round-based collect + extract: scroll, extract the new
                # listings, and if some detail pages failed keep scrolling
                # deeper until we reach the requested count (or run out).
                # Dedup sets keep every business at most once.
                collect_target = cap
                found_hrefs = False
                for _round in range(config.MAX_SCROLL_ROUNDS):
                    if len(self.leads) >= cap:
                        break

                    hrefs = await self._scroll_and_collect(
                        page, cap=collect_target, silent=_round > 0
                    )

                    if not hrefs:
                        # One retry — transient network / delayed render happens often.
                        if not found_hrefs and _round == 0:
                            console.print("[yellow]  ⚠ No results yet, retrying once…[/]")
                            await asyncio.sleep(3)
                            await page.goto(search_url, wait_until="domcontentloaded", timeout=30_000)
                            await asyncio.sleep(3)
                            await self._dismiss_consent(page)
                            if await self._looks_blocked(page):
                                raise RuntimeError(
                                    "Google served a captcha / unusual-traffic page. "
                                    "Wait a few minutes before retrying."
                                )
                            continue
                        break

                    found_hrefs = True
                    new_hrefs: list[str] = []
                    for h in hrefs:
                        canon = _canonical_maps_url(h) or h
                        if canon in self._seen_canon or h in self._seen_hrefs:
                            continue
                        self._seen_canon.add(canon)
                        self._seen_hrefs.add(h)
                        new_hrefs.append(h)

                    if not new_hrefs:
                        break  # feed exhausted — nothing new to extract

                    # Extract what we still need plus a buffer for failures.
                    need = cap - len(self.leads)
                    buffer = max(5, need) if need > 0 else 0
                    await self._extract_all(page, new_hrefs[: need + buffer])

                    # No leads at all after a full round → detail pages are
                    # blocked; don't waste time scrolling the whole list.
                    if not self.leads and _round >= 1:
                        break

                    # Next round scrolls deeper to find replacement leads.
                    collect_target = max(
                        len(self._seen_hrefs) + 5, collect_target + 10
                    )

                # Listings found but zero extracted → detail pages were blocked
                # (redirects to login/captcha). Fail loudly instead of empty.
                if found_hrefs and not self.leads:
                    raise RuntimeError(
                        "Found listings but could not read their details — "
                        "Google likely blocked the detail pages. Try again shortly."
                    )
            except Exception as e:
                console.print(f"[bold red]❌ Error: {e}[/]")
                raise
            finally:
                await browser.close()

        console.print(f"\n[bold green]✅ Scraped {len(self.leads)} unique leads[/]\n")
        return self.leads[:cap]

    async def _dismiss_consent(self, page: Page):
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
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue

    async def _looks_blocked(self, page: Page) -> bool:
        """True when Google is showing a captcha / unusual-traffic page."""
        try:
            if (
                await page.locator(
                    "iframe[src*='recaptcha'], iframe[src*='captcha']"
                ).count()
                > 0
            ):
                return True
            body = (await page.locator("body").inner_text(timeout=3_000)).lower()
            return any(hint in body for hint in CAPTCHA_HINTS)
        except Exception:
            return False

    # ══════════════════════════════════════════════════════════════════
    #  Internal steps
    # ══════════════════════════════════════════════════════════════════

    @staticmethod
    def _lead_key(lead: Lead) -> str:
        """Unique identity for a lead — strongest signal first.

        Real place id (CID) > canonical maps URL > normalized name+phone+address.
        This stops the same business appearing twice across queries, zoom
        levels, or URL variants while still collapsing genuinely identical rows.
        """
        cid = (lead.place_id or "").strip() or _extract_cid(lead.google_maps_url)
        if cid:
            return f"cid:{cid.lower()}"
        curl = _canonical_maps_url(lead.google_maps_url)
        if curl:
            return f"url:{curl.lower()}"
        name = re.sub(r"\s+", " ", (lead.name or "").strip().lower())
        phone = re.sub(r"\D", "", lead.phone or "")
        address = re.sub(r"\s+", " ", (lead.address or "").strip().lower())
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

    async def _scroll_and_collect(
        self, page: Page, silent: bool = False, cap: int | None = None
    ) -> list[str]:
        if not silent:
            console.print("[dim]  → Scrolling to load all results…[/]")

        # Stop early once we have enough listings — scrolling until the end of
        # huge lists (up to 1000) wastes time and can blow the Node-side timeout.
        target = max(1, min(cap or config.MAX_LEADS_PER_SEARCH, config.MAX_LEADS_PER_SEARCH))

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
            if cur >= target:
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
                const href = (n.getAttribute("href") || "").trim();
                if (!href) continue;
                // Same place can appear with different zoom / viewport data —
                // dedupe on the canonical form so it is only collected once.
                const canon = href
                  .replace(/@[^/]*z/, "")
                  .replace(/[\\/&]data=[^&\\/?]+/, "");
                if (seen.has(canon)) continue;
                seen.add(canon);
                out.push(href);
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
                    lead = None
                    for attempt in range(config.DETAIL_RETRIES + 1):
                        try:
                            await worker_page.goto(href, wait_until="domcontentloaded", timeout=20_000)
                            await asyncio.sleep(
                                random.uniform(config.DETAIL_DELAY_MIN, config.DETAIL_DELAY_MAX)
                            )
                            lead = await self._extract_one(worker_page, href)
                            if lead and lead.name:
                                break
                        except Exception:
                            pass
                        lead = None
                        if attempt < config.DETAIL_RETRIES:
                            await asyncio.sleep(1.0)

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

            # Real place id (0x…:0x… hex) — unique per business, unlike the
            # name slug, so re-scrapes / different queries match the same row.
            cid = _extract_cid(url)
            if cid:
                lead.place_id = cid

            # Exact place coordinates live in the data blob (!3d!4d); the
            # bare @lat,lng in search results is the map viewport, not the place.
            exact = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
            if exact:
                lead.latitude = float(exact.group(1))
                lead.longitude = float(exact.group(2))
            else:
                coords = re.findall(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
                if coords:
                    lead.latitude = float(coords[0][0])
                    lead.longitude = float(coords[0][1])

            # Store a stable URL (zoom + viewport data stripped) so the same
            # business gets one googleMapsLink across every scrape.
            lead.google_maps_url = _canonical_maps_url(url)

            return lead
        except Exception:
            return None


# ═══════════════════════════════════════════════════════════════════════
#  Convenience wrappers
# ═══════════════════════════════════════════════════════════════════════

async def scrape_google_maps(query: str, max_leads: int | None = None) -> list[Lead]:
    """Single search (quick)."""
    scraper = GoogleMapsScraper()
    return await scraper.scrape(query, max_leads=max_leads)


async def deep_scrape_google_maps(niche: str, city: str) -> list[Lead]:
    """Grid-based deep scrape — covers the entire city."""
    scraper = GoogleMapsScraper()
    return await scraper.deep_scrape(niche, city)
