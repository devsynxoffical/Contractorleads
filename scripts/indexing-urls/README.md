# URLs for the Google Indexing API script

All 513 indexable sitemap URLs (as of 19 Nov 2026), most important first, split to fit the default
quota of 200 requests per day. Run one file per day:

    node scripts/google-indexing-api.mjs /path/to/key.json scripts/indexing-urls/day1.txt
    node scripts/google-indexing-api.mjs /path/to/key.json scripts/indexing-urls/day2.txt
    node scripts/google-indexing-api.mjs /path/to/key.json scripts/indexing-urls/day3.txt

day1: all main pages, tools, comparisons, 18 trade hubs, 51 location pages, 44 guides, help centre, and
the trade + state pages for the 10 biggest states. day2-3: the remaining trade + state pages.
Noindexed, redirected and removed URLs are not included.
