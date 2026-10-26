# Migration report

Source: public pages of www.muslimheritage.in (crawled 2026-10-26).
Target: Cloudflare D1 `islam-heritage` (`b3f52577-e936-4855-8bb6-70be5e0551d8`) and R2 bucket `islam-heritage`.
Remote import ran 2026-10-26 12:38–12:45 UTC (`migration/data/import-report.remote.json`).
Per-URL status: `migration/data/inventory.csv`.

## Counts (source vs. remote database, queried after import)

| Item | Source | Imported | Notes |
|---|---|---|---|
| Articles | 145 | 145 published | Bodies sanitised; lead image lifted out of 145 bodies into the featured-image field |
| Authors | 141 | 141 | |
| Article ↔ author links | 144 | 144 | Article 7 has no author on the source page |
| Sections | 23 | 23 | Original order kept; 7 articles (1–7) belong to no section, as on the source |
| Board members | 84 | 84 | Director 35, Advisory 49 |
| Pages | 2 | 2 | About, Contact |
| Media (R2) | 266 | 266 rows, 266 objects | Every row checked present in R2 after upload. Of the 7 site images, the 3 still used (logo, conference banner, Hira Centre photo) ship in `public/images`; all 7 originals stay in `migration/media/images` |
| Search index rows | — | 145 | Malayalam query `മലബാര്` returns 90 hits on the remote DB |

Integrity checks after import: 0 empty bodies, 0 U+FFFD replacement characters, 0 inline images without a media row, 0 media rows missing in R2, 0 import problems.

## Inventory status (329 legacy URLs)

| Status | Count | Items |
|---|---|---|
| verified | 326 | Present in remote D1 / rendered by the new site |
| failed | 2 | `/gallery`, `/confindex/2` — HTTP 500 on the **legacy** server; `/gallery` is rebuilt from conference photos |
| requires review | 1 | `/innermore/7` — imported; source shows no author (interview). Attribute manually if known |

## Not recovered / open items

* Article ids 46, 124, 125, 127 and author ids 14, 15 are not linked anywhere on the public site and were not probed. If the old database is available, compare against it.
* Unpublished/draft content and original full-resolution media can only come from the legacy Laravel database and `uploads/` folder (not available).
* No image alt text or captions existed on the source; alt text falls back to the article title or author name. Add real descriptions in Admin → Media.
* `R2_BUCKET_NAME` in `.env` says `muslim-heritage`, but that bucket does not exist; the keys only reach `islam-heritage`, which was used.
* The public `r2.dev` URL in `.env` returns 404 for the uploaded objects (it is not attached to `islam-heritage`). Media is served through the site's `/uploads/...` route until public access is configured — see README → Media CDN.

## Re-running

The import is idempotent: media upserts by key (skipped when the SHA-256 matches), content rows by legacy id. Without `--force`, existing rows are left untouched so CMS edits survive; the search index is always rebuilt from the database.
