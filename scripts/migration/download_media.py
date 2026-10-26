"""Download every media file referenced in content.json, preserving legacy paths.

Usage: python -I -X utf8 scripts/migration/download_media.py migration/data migration/media

Resumable: files already on disk are skipped. Writes media-manifest.json with
size, sha256, mime type and pixel dimensions (or the failure reason).
"""
import hashlib
import json
import struct
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

DATA = Path(sys.argv[1])
DEST = Path(sys.argv[2])
content = json.loads((DATA / "content.json").read_text(encoding="utf-8"))

MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif",
        ".ico": "image/x-icon", ".webp": "image/webp", ".pdf": "application/pdf"}


def dimensions(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", b[16:24])
    if b[:6] in (b"GIF87a", b"GIF89a"):
        return struct.unpack("<HH", b[6:10])
    if b[:2] == b"\xff\xd8":
        i = 2
        while i < len(b) - 9:
            if b[i] != 0xFF:
                i += 1
                continue
            marker = b[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", b[i + 5:i + 9])
                return w, h
            i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
    return None, None


def detect_mime(b, ext):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if b[:3] == b"GIF":
        return "image/gif"
    if b[:2] == b"\xff\xd8":
        return "image/jpeg"
    if b[:4] == b"%PDF":
        return "application/pdf"
    return MIME.get(ext, "application/octet-stream")


manifest = []
for m in content["media"]:
    path = urllib.parse.urlsplit(m["url"]).path
    key = urllib.parse.unquote(path).lstrip("/")
    local = DEST / key
    entry = {"legacy_url": m["url"], "key": key, "kind": m["kind"], "used_by": m["used_by"]}
    try:
        if not local.exists():
            req = urllib.request.Request(m["url"], headers={"User-Agent": "MuslimHeritageMigrationAudit/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(data)
            time.sleep(0.2)
        data = local.read_bytes()
        if not data:
            raise ValueError("empty file")
        w, h = dimensions(data)
        entry.update(status="downloaded", bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                     mime=detect_mime(data, local.suffix.lower()), width=w, height=h)
    except Exception as e:  # noqa: BLE001 - record and continue, never drop silently
        entry.update(status="failed", error=str(e)[:200])
    manifest.append(entry)
    print(entry["status"], key, flush=True)

(DATA / "media-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
ok = sum(1 for e in manifest if e["status"] == "downloaded")
print(f"downloaded {ok}/{len(manifest)}")
