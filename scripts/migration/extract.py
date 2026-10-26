"""Parse crawled legacy pages (migration/crawl) into structured content.

Usage: python -I -X utf8 scripts/migration/extract.py migration/crawl migration/data

Outputs:
  content.json   - conferences, sections, articles, authors, boards, pages, media
  inventory.csv  - one row per legacy URL / content item with migration status
"""
import csv
import html
import json
import re
import sys
from pathlib import Path

CRAWL = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://www.muslimheritage.in"

index = json.loads((CRAWL / "index.json").read_text(encoding="utf-8"))
by_path = {}
for rec in index:
    path = rec["url"][len(BASE):] or "/"
    by_path[path] = rec

inventory = []  # dicts: legacy_url, type, legacy_id, status, note


def page(path):
    rec = by_path.get(path)
    if not rec or rec.get("status") != 200 or not rec.get("file"):
        return None
    text = (CRAWL / "pages" / rec["file"]).read_text(encoding="utf-8")
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def text_of(fragment):
    """HTML fragment -> plain text (keeps ZWJ/ZWNJ, collapses whitespace)."""
    fragment = re.sub(r"<br\s*/?>", " ", fragment, flags=re.I)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(html.unescape(fragment))).strip()


def abs_url(src):
    src = src.strip()
    if src.startswith("http"):
        return re.sub(r"^https?://(www\.)?muslimheritage\.in", BASE, src)
    return BASE + "/" + src.lstrip("/")


media = {}  # legacy url -> {"url", "kind", "used_by": set}


def add_media(src, kind, used_by):
    url = abs_url(src)
    m = media.setdefault(url, {"url": url, "kind": kind, "used_by": set()})
    m["used_by"].add(used_by)
    return url


def clean_body(fragment, used_by):
    """Normalise legacy article HTML. Formatting preserved; sanitised again at import."""
    fragment = fragment.strip()
    fragment = re.sub(r"<script.*?</script>", "", fragment, flags=re.S | re.I)
    fragment = re.sub(r"\s(style|class|align|width|height|border)=\"[^\"]*\"", "", fragment, flags=re.I)

    def img(m):
        src = re.search(r"src=\"([^\"]+)\"", m.group(0))
        if not src:
            return ""
        return f'<img src="{add_media(src.group(1), "article-inline", used_by)}" alt="">'

    fragment = re.sub(r"<img[^>]*>", img, fragment, flags=re.I)
    fragment = re.sub(r"<p>\s*(&nbsp;|\s)*</p>", "", fragment)
    return fragment


# ---------------------------------------------------------------- articles
articles = {}
for path, rec in sorted(by_path.items(), key=lambda kv: kv[0]):
    m = re.fullmatch(r"/innermore/(\d+)", path)
    if not m:
        continue
    aid = int(m.group(1))
    t = page(path)
    if t is None:
        inventory.append({"legacy_url": path, "type": "article", "legacy_id": aid, "status": "failed", "note": f"HTTP {rec.get('status')}"})
        continue
    p0 = t.find('<div id="print">')
    # Body ends at the author panel; interview pages have no panel, so fall back to the print button.
    ends = [i for i in (t.find('<div class="panel">', p0), t.find('<input name="b_print"', p0)) if i > 0]
    p1 = min(ends)
    block = t[p0:p1]
    title_html = re.search(r"<h3>(.*?)</h3>", block, re.S).group(1)
    author_div = re.search(r'<div class="author">(.*?)</div>', block, re.S)
    body_start = author_div.end() if author_div else block.find("</h3>") + 5
    body = block[body_start:]
    body = re.sub(r"</div>\s*$", "", body.strip())  # closing div#print
    side = t[p1:t.find('<input name="b_print"', p0)] if '<div class="panel">' in t else ""
    author_ids = [int(x) for x in re.findall(r'href="/author/(\d+)"', side)]
    related = [int(x) for x in re.findall(r'href="/innermore/(\d+)"', t[t.find("RELATED ARTICLES"):])]
    byline = text_of(author_div.group(1)) if author_div else ""
    body_html = clean_body(body, path)
    first_img = re.search(r'<img src="([^"]+)"', body_html)
    articles[aid] = {
        "legacy_id": aid,
        "legacy_url": path,
        "title": text_of(title_html),
        "title_parts": [text_of(x) for x in re.split(r"<br\s*/?>", title_html) if text_of(x)],
        "byline": byline,
        "author_ids": author_ids,
        "body_html": body_html,
        "lead_image": first_img.group(1) if first_img else None,
        "related_ids": related,
        "section_ids": [],
        "featured_order": None,
    }
    issues = []
    if not text_of(body_html):
        issues.append("empty body")
    if not author_ids:
        issues.append("no linked author")
    inventory.append({"legacy_url": path, "type": "article", "legacy_id": aid,
                      "status": "requires-review" if issues else "extracted", "note": "; ".join(issues)})

# ---------------------------------------------------------------- authors
authors = {}
for path, rec in sorted(by_path.items()):
    m = re.fullmatch(r"/author/(\d+)", path)
    if not m:
        continue
    aid = int(m.group(1))
    t = page(path)
    if t is None:
        inventory.append({"legacy_url": path, "type": "author", "legacy_id": aid, "status": "failed", "note": f"HTTP {rec.get('status')} {rec.get('content_type', '')[:80]}"})
        continue
    panel = re.search(r'<div class="panel">(.*?)<p class="clear authortext">(.*?)</p>', t, re.S)
    av = re.search(r'<img src="([^"]*)"', panel.group(1))
    name = re.search(r"<h5>(.*?)</h5>", panel.group(1), re.S)
    desig = re.search(r"<span>(.*?)</span>", panel.group(1), re.S)
    photo = av.group(1).strip() if av else ""
    authors[aid] = {
        "legacy_id": aid,
        "legacy_url": path,
        "name": text_of(name.group(1)) if name else "",
        "designation": text_of(desig.group(1)) if desig else "",
        "bio": text_of(panel.group(2)),
        "photo": add_media(photo, "author", path) if photo and not photo.endswith("/author/") else None,
        "article_ids": [int(x) for x in dict.fromkeys(re.findall(r'href="/innermore/(\d+)"', t[panel.end():t.find('<div class="four columns">', panel.end())]))],
    }
    inventory.append({"legacy_url": path, "type": "author", "legacy_id": aid, "status": "extracted", "note": ""})

# ---------------------------------------------------------------- sections (innerindex)
sections = {}
conf = page("/confindex/1")
for order, (sid, title) in enumerate(re.findall(r'<li><a href="/innerindex/(\d+)">(.*?)</a></li>', conf), start=1):
    sections[int(sid)] = {"legacy_id": int(sid), "legacy_url": f"/innerindex/{sid}", "title": text_of(title),
                          "sort_order": order, "image": None, "article_ids": []}
for path in sorted(by_path):
    m = re.fullmatch(r"/innerindex/(\d+)(?:\?page=(\d+))?", path)
    if not m:
        continue
    sid = int(m.group(1))
    t = page(path)
    sec = sections.setdefault(sid, {"legacy_id": sid, "legacy_url": f"/innerindex/{sid}", "title": "", "sort_order": 999, "image": None, "article_ids": []})
    if t is None:
        inventory.append({"legacy_url": path, "type": "section", "legacy_id": sid, "status": "failed", "note": "fetch failed"})
        continue
    head = re.search(r'<img src="([^"]+)" class="blogimage"', t)
    if head and not sec["image"]:
        sec["image"] = add_media(head.group(1), "section", path)
    title = re.search(r'<div class="sectiontitle"><h4>(.*?)</h4>', t, re.S)
    if title and not sec["title"]:
        sec["title"] = text_of(title.group(1))
    for aid, thumb in re.findall(r'<a href="/innermore/(\d+)">.*?</a>.*?<img src="([^"]+)"', t[t.find("main-list"):t.find("pagenav")], re.S):
        aid = int(aid)
        if aid not in sec["article_ids"]:
            sec["article_ids"].append(aid)
        if aid in articles:
            if sid not in articles[aid]["section_ids"]:
                articles[aid]["section_ids"].append(sid)
            articles[aid].setdefault("thumbnail", add_media(thumb, "article-thumb", path))
    if "?page=" not in path:
        inventory.append({"legacy_url": path, "type": "section", "legacy_id": sid, "status": "extracted", "note": ""})
    else:
        inventory.append({"legacy_url": path, "type": "section-page", "legacy_id": sid, "status": "extracted", "note": "pagination of section"})

# ---------------------------------------------------------------- conference
slides = list(dict.fromkeys(re.findall(r'<img src="([^"]+)"[^>]*class="responsiveslide"', conf)))
gallery = list(dict.fromkeys(re.findall(r'<img src="([^"]+)" class="fourimage"', conf)))
featured = list(dict.fromkeys(int(x) for x in re.findall(r'<div class="boxblog">\s*<h5><a href="/innermore/(\d+)"', conf)))
for i, aid in enumerate(featured, start=1):
    if aid in articles:
        articles[aid]["featured_order"] = i
conference = {
    "legacy_id": 1,
    "legacy_url": "/confindex/1",
    "title": "കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ്",
    "subtitle": "പ്രബന്ധസമാഹാരം",
    "slides": [add_media(s, "conference-slide", "/confindex/1") for s in slides],
    "gallery": [add_media(s, "conference-gallery", "/confindex/1") for s in gallery],
    "featured_article_ids": featured,
}
inventory.append({"legacy_url": "/confindex/1", "type": "conference", "legacy_id": 1, "status": "extracted", "note": f"{len(slides)} slides, {len(gallery)} gallery photos, {len(featured)} featured articles"})

# ---------------------------------------------------------------- static pages + boards


def subheader_page(path):
    t = page(path)
    start = t.find('<div id="subheader">')
    end = t.find('<div id="footer">')
    return t[start:end]


about = subheader_page("/about")
about_main = re.search(r'<div class="eight columns inn">(.*?)</div>\s*<div class="four columns">', about, re.S).group(1)
about_title = re.search(r"<h3>(.*?)</h3>", about_main, re.S).group(1)
pages = {
    "about": {"slug": "about", "legacy_url": "/about", "title": "About Us", "heading": text_of(about_title),
              "body_html": "\n".join(f"<p>{text_of(p)}</p>" for p in re.findall(r"<p>(.*?)</p>", about_main, re.S) if text_of(p))},
}
contact = subheader_page("/contact")
addr = re.search(r"<h5>Address</h5>\s*<p>(.*?)</p>", contact, re.S).group(1)
contact_lines = [text_of(x) for x in re.split(r"<br\s*/?>", addr) if text_of(x)]
pages["contact"] = {"slug": "contact", "legacy_url": "/contact", "title": "Contact Us",
                    "lines": contact_lines, "image": add_media("/images/hira.jpg", "page", "/contact")}

director = subheader_page("/director")
board = []
for role, names in re.findall(r"<h5>(.*?)</h5>\s*<p>(.*?)</p>", director, re.S):
    role = text_of(role).rstrip(":")
    for n in text_of(names).split(","):
        if n.strip():
            board.append({"board": "director", "role": "Member" if role.upper() == "MEMBERS" else role, "name": n.strip()})
advisory = subheader_page("/advisory")
for _, names in re.findall(r"<h5>(.*?)</h5>\s*<p>(.*?)</p>", advisory, re.S):
    for n in text_of(names).split(","):
        if n.strip():
            board.append({"board": "advisory", "role": "Member", "name": n.strip()})
for p in ("/", "/about", "/contact", "/director", "/advisory"):
    inventory.append({"legacy_url": p, "type": "page", "legacy_id": "", "status": "extracted", "note": ""})
for p in ("/gallery", "/confindex/2"):
    rec = by_path.get(p, {})
    inventory.append({"legacy_url": p, "type": "page", "legacy_id": "", "status": "failed",
                      "note": f"legacy server returned HTTP {rec.get('status')} (broken on old site)"})

# site chrome assets
for src, kind in (("/images/logo.png", "brand"), ("/images/favicon.ico", "brand"), ("/images/conf1.jpg", "brand"),
                  ("/images/conf2.jpg", "brand"), ("/images/version1.png", "brand"), ("/images/version2.png", "brand")):
    add_media(src, kind, "/")

# ---------------------------------------------------------------- cross-checks
for aid, a in articles.items():
    for au in a["author_ids"]:
        if au not in authors:
            a.setdefault("issues", []).append(f"author {au} not extracted")
for au in authors.values():
    for aid in au["article_ids"]:
        if aid in articles and au["legacy_id"] not in articles[aid]["author_ids"]:
            articles[aid]["author_ids"].append(au["legacy_id"])
unsectioned = [a["legacy_id"] for a in articles.values() if not a["section_ids"]]

content = {
    "source": BASE,
    "conference": conference,
    "sections": sorted(sections.values(), key=lambda s: s["sort_order"]),
    "articles": [articles[k] for k in sorted(articles)],
    "authors": [authors[k] for k in sorted(authors)],
    "board_members": board,
    "pages": pages,
    "media": [{**m, "used_by": sorted(m["used_by"])} for m in sorted(media.values(), key=lambda m: m["url"])],
    "stats": {
        "articles": len(articles), "authors": len(authors), "sections": len(sections),
        "board_members": len(board), "media": len(media), "articles_without_section": unsectioned,
    },
}
(OUT / "content.json").write_text(json.dumps(content, ensure_ascii=False, indent=1), encoding="utf-8")
with open(OUT / "inventory.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["legacy_url", "type", "legacy_id", "status", "note"])
    w.writeheader()
    w.writerows(sorted(inventory, key=lambda r: (r["type"], str(r["legacy_id"]).zfill(6), r["legacy_url"])))
print(json.dumps(content["stats"], ensure_ascii=False))
