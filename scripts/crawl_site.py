"""Crawl the live WordPress site and download its imagery into reference/.

Run from the repo root:  python scripts/crawl_site.py

Produces:
  reference/wp-pages/          raw HTML of every public page
  reference/wp-media/          every image, thumbnails collapsed to originals
  reference/_crawl_manifest.json   the URL list (also feeds the SEO redirect map, spec section 10)
"""
import json
import os
import re
import ssl
import urllib.parse
import urllib.request
from collections import OrderedDict

ROOT = "https://www.mahuaresorts.com"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "reference")
HTML_DIR = os.path.join(OUT, "wp-pages")
IMG_DIR = os.path.join(OUT, "wp-media")

HDRS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}
CTX = ssl.create_default_context()
IMG_EXT = re.compile(r"\.(jpe?g|png|webp|gif|svg|avif)(\?|$)", re.I)
MEDIA_EXT = re.compile(r"\.(mp4|webm|mov|m4v)(\?|$)", re.I)


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=90, context=CTX) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", "ignore")


def same_site(u):
    return urllib.parse.urlparse(u).netloc.lower().endswith("mahuaresorts.com")


def norm(u, base):
    return urllib.parse.urldefrag(urllib.parse.urljoin(base, u.strip()))[0]


def crawl():
    seen, queue, pages = set(), [ROOT + "/"], OrderedDict()
    while queue:
        url = queue.pop(0)
        if url in seen or not same_site(url):
            continue
        seen.add(url)
        if IMG_EXT.search(url) or MEDIA_EXT.search(url) or re.search(r"\.(pdf|zip|css|js|xml)$", url, re.I):
            continue
        try:
            html = fetch(url)
        except Exception as e:
            print("  skip", url, e)
            continue
        pages[url] = html
        slug = urllib.parse.urlparse(url).path.strip("/").replace("/", "_") or "home"
        with open(os.path.join(HTML_DIR, slug + ".html"), "w", encoding="utf-8") as f:
            f.write(html)
        for href in re.findall(r'href=["\']([^"\']+)["\']', html):
            if href.startswith(("mailto:", "tel:", "javascript:", "#")):
                continue
            nu = norm(href, url)
            if same_site(nu) and nu not in seen and "/wp-" not in nu and "?" not in nu:
                queue.append(nu)
    return pages


def harvest(pages):
    imgs, vids = set(), set()
    for url, html in pages.items():
        for attr in ("src", "data-src", "data-lazy-src", "content", "href", "data-bg"):
            for u in re.findall(attr + r'=["\']([^"\']+)["\']', html):
                nu = norm(u, url)
                if not same_site(nu):
                    continue
                (imgs if IMG_EXT.search(nu) else vids if MEDIA_EXT.search(nu) else set()).add(nu)
        for ss in re.findall(r'srcset=["\']([^"\']+)["\']', html):
            for part in ss.split(","):
                u = part.strip().split(" ")[0]
                nu = norm(u, url) if u else ""
                if nu and same_site(nu) and IMG_EXT.search(nu):
                    imgs.add(nu)
        for _, u in re.findall(r'url\((["\']?)([^)"\']+)\1\)', html):
            nu = norm(u, url)
            if same_site(nu) and IMG_EXT.search(nu):
                imgs.add(nu)
    return imgs, vids


def main():
    os.makedirs(HTML_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    pages = crawl()
    print(f"PAGES CRAWLED: {len(pages)}")
    for p in pages:
        print("  ", p)

    imgs, vids = harvest(pages)
    # collapse WordPress thumbnail variants (-1024x768.jpg) back to the original
    originals = sorted({re.sub(r"-\d{2,4}x\d{2,4}(\.[a-z]+)$", r"\1", u, flags=re.I) for u in imgs})
    print(f"\nIMAGE URLS: {len(imgs)} variants -> {len(originals)} originals")
    print(f"VIDEO FILES: {len(vids)}")

    ok = skip = fail = 0
    for u in originals:
        dest = os.path.join(IMG_DIR, os.path.basename(urllib.parse.urlparse(u).path))
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skip += 1
            continue
        try:
            with open(dest, "wb") as f:
                f.write(fetch(u, binary=True))
            ok += 1
        except Exception:
            fail += 1
    print(f"\ndownloaded={ok} already_had={skip} failed={fail}")

    with open(os.path.join(OUT, "_crawl_manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"pages": list(pages.keys()), "images": originals, "videos": sorted(vids)}, f, indent=2)


if __name__ == "__main__":
    main()
