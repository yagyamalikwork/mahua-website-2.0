"""Extract base64-embedded images from the prior HTML mockups into reference/mockup-media/.

Run from the repo root:  python scripts/extract_mockup_imgs.py

The mockups live in the parent folder and each embed their imagery as base64 data URIs.
These photographs are BETTER CURATED than the ones on the live site -- the hero-grade
dusk shots (lantern bridge, Tola pool) come from here, not from WordPress.

Files are named from the nearest following alt attribute, plus a content hash for dedupe.
"""
import base64
import hashlib
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.dirname(REPO)  # parent folder holding the mockups
OUT = os.path.join(REPO, "reference", "mockup-media")

MOCKUPS = [
    "mahua-home-v1-forest.html",
    "mahua-home-v3-fieldguide.html",
    "mahua-brand-guidelines-v1-forest.html",
    "mahua-brand-guidelines-v3-fieldguide.html",
]


def main():
    os.makedirs(OUT, exist_ok=True)
    seen = {}

    for fn in MOCKUPS:
        path = os.path.join(SRC, fn)
        if not os.path.exists(path):
            print("missing:", fn)
            continue
        html = open(path, encoding="utf-8", errors="ignore").read()

        for i, m in enumerate(re.finditer(r"data:image/([a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)", html)):
            ext = m.group(1).lower().replace("jpeg", "jpg")
            raw = base64.b64decode(m.group(2))
            digest = hashlib.sha1(raw).hexdigest()[:10]
            if digest in seen:
                continue
            tail = html[m.end():m.end() + 400]
            alt = re.search(r'alt=["\']([^"\']{3,90})["\']', tail)
            label = (
                re.sub(r"[^a-z0-9]+", "-", alt.group(1).lower()).strip("-")[:55]
                if alt else f"{os.path.splitext(fn)[0]}-{i:02d}"
            )
            name = f"{label}-{digest}.{ext}"
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(raw)
            seen[digest] = (name, len(raw))

    print(f"UNIQUE IMAGES EXTRACTED: {len(seen)}")
    for name, size in sorted(seen.values(), key=lambda x: -x[1]):
        print(f"  {round(size / 1024):>5} KB  {name}")


if __name__ == "__main__":
    main()
