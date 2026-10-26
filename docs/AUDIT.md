# Legacy site audit — www.muslimheritage.in

Audit date: 2026-10-26. Method: polite breadth-first crawl of every internal link from `/`
plus the known static pages (`scripts/migration/crawl.py`), saved under `migration/crawl/`.
No authentication was used or bypassed.

## Platform

| Finding | Detail |
|---|---|
| Framework | **Laravel (PHP) on Apache** — `XSRF-TOKEN` / `heritage_session` cookies and a Laravel 404 page. It is *not* WordPress, so no WXR export or WP REST API exists. |
| Sitemap | None (`/sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml` → 404). |
| robots.txt | `User-agent: * / Disallow:` (everything allowed). |
| SEO metadata | Every page shares `<title>History Conference</title>` and a generic description/keywords. No canonical, Open Graph or structured data. |
| Third-party embeds | Facebook like-box and comments, AddToAny share buttons. |
| Brand assets | `/images/logo.png` (white wordmark + green/yellow emblem, needs a dark background), `/images/favicon.ico`, conference banner `/images/conf1.jpg`. |

## Discovered URLs (329)

| Pattern | Count | Page type |
|---|---|---|
| `/` | 1 | Home: two conference banners (`/confindex/1`, second links to `#`) |
| `/confindex/1` | 1 | Conference proceedings: 20-photo slider, 8-photo gallery strip, 6 introduction articles, list of 23 sections |
| `/confindex/2` | 1 | **HTTP 500** on the legacy server (second conference never published) |
| `/innerindex/{1–23}` | 23 | Section (topic) listing; 5 sections paginate with `?page=N` (12 extra URLs) |
| `/innermore/{id}` | 145 | Article (ids 1–149; 46, 124, 125, 127 are not linked from anywhere and were not probed) |
| `/author/{id}` | 141 | Author profile: photo, name, designation, article list (ids 1–143; 14, 15 not linked) |
| `/about`, `/contact` | 2 | Static pages (Malayalam about text; address, phone, email) |
| `/director`, `/advisory` | 2 | Board lists (4 officers + 31 members; 49 advisory members) |
| `/gallery` | 1 | **HTTP 500** on the legacy server |

Navigation: header (Home, About Us, Contact); footer (contact block, Facebook, Director Board, Advisory Board).

## Content

* **145 articles** (~3.3 MB of HTML), Malayalam except 11 English papers (ids 131–140, 147).
  Markup: `<p>`, `<br>`, `<strong>`, `<sup>` footnote markers, `<h5>` sub-heads and **`<address>` used for verse lines** (1,133 occurrences). No PDFs or downloadable documents were found.
* Each article: title (with a `<br><span>` highlighted second line), byline (author + designation), lead image as the first element of the body, one author link, "related articles" (same section).
* Article 7 is an interview without an author block.
* Articles 1–6 are the proceedings' introductions (ആമുഖം), not in any section.
* **141 authors**, all with a photo, none with a biography.
* **273 media files** (7.1 MB): 145 article images, 93 author photos, 28 conference photographs, 7 site images.

## Decisions taken from the audit

* Keep every legacy path as the canonical URL (`/innermore/:id`, `/author/:id`, `/innerindex/:id`, `/confindex/:id`, `/about`, `/contact`, `/director`, `/advisory`, `/gallery`) — database ids equal legacy ids, so no redirects are needed.
* Keep media at its legacy path (`/uploads/...`) — old image links keep working.
* Preserve `<address>` verse markup; use a source HTML editor rather than a WYSIWYG editor that would rewrite it.
* `/gallery` (broken before) now renders the conference photographs; `/confindex/2` stays 404.
* Data model: conference → sections → articles ↔ authors, plus boards, pages, media.
