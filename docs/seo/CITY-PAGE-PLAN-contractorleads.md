# City / location page plan (25 Nov 2026): contractorleads.us rows

Source: City_Page_Map_Gaurav_Sites.csv (CL rows) and the 25 Nov PDF. Week 1 = week of 25 Nov 2026.

## Step 1: inventory (CL rows)
| URL | Status | Note |
|---|---|---|
| /industries/{trade}/{state} (900) | exists | 350 were indexable, 550 already noindex. 28 days: 20 impressions, 0 clicks |
| /locations/{state} (50) | noindex,follow since 27 Nov | removed from sitemap-locations.xml and llms.txt; /locations hub stays indexable |
| /businesses-without-websites | exists | changed 24 Nov (7-day rule) |
| /contractor-license-lookup (+13 states) | missing | week 3 to 7 |
| /lead-finder | missing | week 8 |
| /leads-for-marketing-agencies | missing | week 8 (overlaps homepage target; decide then) |
| /contractor-list, /contractor-email-list | exist | week 9 |
| /apollo-alternative | exists | week 10 |
| /google-maps-lead-extractor | missing (/google-maps-scraper exists) | week 12, owner approval needed |

## Week 1 (done 25 Nov)
- All /industries/{trade}/{state} pages: noindex,follow. 18 /industries/{trade} hubs stay indexable.
- sitemap-states.xml (350) and sitemap-removed.xml (550) removed from the sitemap index and deleted.
- Skipped (7-day rule): /locations/{state} noindex. Template last changed 20 Nov; apply on or after 27 Nov,
  then drop sitemap-locations.xml states (keep the /locations hub only if it stays indexable).

## Blocked / waiting
- License lookup guides (weeks 3-7): the plan requires facts from each board's own site (CSLB, DBPR, ROC...).
  Those sites are not reachable from this environment's network. Need: network access to the board domains,
  or facts supplied by the owner with source URLs.
- Week 11 (about 10 Feb 2027): 301 each noindexed trade+state page to /industries/{trade}.
