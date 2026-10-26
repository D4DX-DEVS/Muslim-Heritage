"""Polite BFS crawler for www.muslimheritage.in. Saves pages + index JSON."""
import hashlib, json, re, sys, time, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path

OUT = Path(sys.argv[1])
(OUT / "pages").mkdir(parents=True, exist_ok=True)
HOSTS = {"www.muslimheritage.in", "muslimheritage.in"}
BASE = "https://www.muslimheritage.in/"
ASSET_EXT = re.compile(r"\.(jpe?g|png|gif|webp|svg|ico|pdf|docx?|pptx?|xlsx?|zip|mp3|mp4|css|js)$", re.I)


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.assets = [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for k in ("href", "src", "data-src"):
            v = a.get(k)
            if v:
                (self.assets if tag in ("img", "script", "link", "source", "iframe") and k != "href" or (tag == "link") else self.links).append(v.strip())


def norm(u, base):
    u = urllib.parse.urljoin(base, u)
    p = urllib.parse.urlsplit(u)
    if p.scheme not in ("http", "https") or p.hostname not in HOSTS:
        return None
    path = re.sub(r"/{2,}", "/", p.path or "/")
    return urllib.parse.urlunsplit(("https", "www.muslimheritage.in", path, p.query, ""))


def fetch(u):
    req = urllib.request.Request(u, headers={"User-Agent": "MuslimHeritageMigrationAudit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read(), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", ""), e.read(), u
    except Exception as e:  # noqa: BLE001
        return 0, str(e), b"", u


seeds = [BASE] + [BASE + s for s in sys.argv[2:]]
queue, seen, index, assets = list(seeds), set(seeds), [], {}
while queue:
    u = queue.pop(0)
    status, ctype, body, final = fetch(u)
    rec = {"url": u, "status": status, "content_type": ctype, "final_url": final, "bytes": len(body)}
    if status == 200 and "text/html" in ctype:
        fname = hashlib.sha1(u.encode()).hexdigest()[:16] + ".html"
        (OUT / "pages" / fname).write_bytes(body)
        rec["file"] = fname
        text = body.decode("utf-8", "replace")
        m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
        rec["title"] = m.group(1).strip() if m else ""
        lp = LinkParser()
        lp.feed(text)
        for l in lp.links:
            n = norm(l, final)
            if not n:
                continue
            if ASSET_EXT.search(urllib.parse.urlsplit(n).path):
                assets.setdefault(n, set()).add(u)
            elif n not in seen:
                seen.add(n)
                queue.append(n)
        for a in lp.assets:
            n = norm(a, final)
            if n:
                assets.setdefault(n, set()).add(u)
    index.append(rec)
    print(status, u, flush=True)
    time.sleep(0.4)

(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
(OUT / "assets.json").write_text(json.dumps({k: sorted(v) for k, v in sorted(assets.items())}, indent=1), encoding="utf-8")
print("pages", len(index), "assets", len(assets))
