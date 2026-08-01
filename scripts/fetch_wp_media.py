"""Download the WordPress media library via the REST API into reference/wp-media/.

Run from the repo root:  python scripts/fetch_wp_media.py

Complements scripts/crawl_site.py. The crawler finds images actually *used* on pages;
this finds images sitting in the media library, including ones no page references.

Note: the API reports ~137 media items but only exposes ~27 to unauthenticated callers.
Together with the crawler this yields roughly 56 unique files. The remainder would need
an authenticated request.

Also writes reference/wp-media/_manifest.json with dimensions, captions and alt text --
useful evidence for the audit finding that most images on the live site have no alt text.
"""
import json
import os
import re
import ssl
import urllib.request

BASE = "https://www.mahuaresorts.com"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "reference", "wp-media")

HDRS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}
CTX = ssl.create_default_context()


def api(path):
    req = urllib.request.Request(BASE + path, headers=HDRS)
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        return json.loads(r.read())


def strip(s):
    return re.sub("<[^>]+>", "", s or "").strip()


def main():
    os.makedirs(OUT, exist_ok=True)

    media, page = [], 1
    while True:
        batch = api(
            f"/wp-json/wp/v2/media?per_page=100&page={page}"
            "&_fields=id,alt_text,caption,title,media_details,source_url,mime_type"
        )
        if not batch:
            break
        media.extend(batch)
        if len(batch) < 100:
            break
        page += 1

    manifest = []
    for m in media:
        md = m.get("media_details") or {}
        manifest.append({
            "id": m["id"],
            "file": md.get("file") or m["source_url"].split("/")[-1],
            "url": m["source_url"],
            "mime": m.get("mime_type"),
            "w": md.get("width"),
            "h": md.get("height"),
            "alt": m.get("alt_text", ""),
            "title": strip((m.get("title") or {}).get("rendered", "")),
            "caption": strip((m.get("caption") or {}).get("rendered", "")),
        })

    with open(os.path.join(OUT, "_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    ok = skip = fail = 0
    for item in manifest:
        dest = os.path.join(OUT, os.path.basename(item["file"]))
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skip += 1
            continue
        try:
            req = urllib.request.Request(item["url"], headers=HDRS)
            with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
                data = r.read()
            with open(dest, "wb") as f:
                f.write(data)
            ok += 1
        except Exception as e:
            fail += 1
            print("  FAIL", item["url"], e)

    print(f"media items exposed: {len(manifest)}")
    print(f"downloaded={ok} already_had={skip} failed={fail}")

    images = [i for i in manifest if (i["mime"] or "").startswith("image")]
    noalt = [i for i in images if not i["alt"].strip()]
    print(f"images with no alt text: {len(noalt)} / {len(images)}")


if __name__ == "__main__":
    main()
