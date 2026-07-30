from __future__ import annotations

import argparse
import asyncio
import contextlib
import io
import json
import sys

import config
from maps_scraper import deep_scrape_google_maps, scrape_google_maps


def _lead_to_payload(lead) -> dict:
    return {
        "place_id": lead.place_id or "",
        "name": lead.name or "",
        "address": lead.address or "",
        "phone": lead.phone or "",
        "website": lead.website or "",
        "rating": lead.rating,
        "review_count": lead.review_count or 0,
        "google_maps_url": lead.google_maps_url or "",
        "latitude": lead.latitude,
        "longitude": lead.longitude,
        "category": lead.category or "",
    }


async def _run(args) -> list[dict]:
    if args.quick:
        if not args.query:
            raise ValueError("--query is required in --quick mode")
        leads = await scrape_google_maps(args.query, max_leads=args.limit)
    else:
        if not args.niche or not args.city:
            raise ValueError("--niche and --city are required in deep mode")
        leads = await deep_scrape_google_maps(args.niche, args.city)
    return [_lead_to_payload(lead) for lead in leads[: args.limit]]


def main():
    parser = argparse.ArgumentParser(description="JSON runner for Gmap scraper")
    parser.add_argument("--quick", action="store_true", help="Run single-query mode")
    parser.add_argument("--query", type=str, default="")
    parser.add_argument("--niche", type=str, default="")
    parser.add_argument("--city", type=str, default="")
    parser.add_argument("--grid", type=int, default=config.GRID_SIZE)
    parser.add_argument("--radius", type=int, default=config.GRID_RADIUS_KM)
    parser.add_argument("--workers", type=int, default=config.DETAIL_WORKERS)
    parser.add_argument("--limit", type=int, default=config.MAX_LEADS_PER_SEARCH)
    args = parser.parse_args()

    config.GRID_SIZE = max(1, min(8, args.grid))
    config.GRID_RADIUS_KM = max(1, min(60, args.radius))
    config.DETAIL_WORKERS = max(1, min(12, args.workers))
    args.limit = max(1, min(config.MAX_LEADS_PER_SEARCH, args.limit))

    # Keep stdout clean JSON-only for Node parser.
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            leads = asyncio.run(_run(args))
        sys.stdout.write(json.dumps({"ok": True, "leads": leads}, ensure_ascii=False))
    except Exception as err:
        sys.stdout.write(json.dumps({"ok": False, "error": str(err)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
