"""Extract the live site's readable copy (headings + paragraphs) from the crawled WP pages.

Run from the repo root:  python scripts/extract_site_copy.py

Reads reference/wp-pages/*.html (regenerate with scripts/crawl_site.py if missing) and writes
reference/site-copy.md: for each real content page, its <title>, then every h1-h4 and p in
document order, stripped of markup.

How nav/header/footer/cookie boilerplate is skipped: on every page of this site the header
(desktop nav + mobile nav, both live inside <header> elements) sits before a single <main>
element, and the footer sits immediately after it. There is no separate cookie-consent plugin
on this site (checked: no cookie-law-info / cookielawinfo / gdpr markers anywhere in
reference/wp-pages/). So walking only the contents of <main>...</main> already excludes all
navigation and footer text without any class/id guessing, and any <script>/<style> tags that
still turn up inside <main> (a couple of pages have one) are stripped explicitly.

Two housekeeping steps beyond the per-tag walk:
  - Adjacent exact-duplicate blocks are collapsed to one, comparing text only (not tag). The
    home page's hero restates its own <h1> as the very next paragraph, in italics -- an <h1>
    and a <p> with identical wording -- a WordPress editing artefact, not a second fact, so
    repeating it in the transcript would be noise, not signal.
  - Pages whose extracted body is byte-for-byte identical to an already-emitted page are
    skipped once found. The site serves /work-with-us/ and /mahuaresorts/work-with-us/ as the
    same content; only the shorter, canonical URL is kept.

Mahua Bagh (Murud) has been retired from the brand, but the live site still sells it. Its own
page is extracted for completeness with a page-level RETIRED note, and -- because Task 6 will
skim this file by chapter rather than read it end to end -- every OTHER page that mentions Bagh
in passing (Home, About Us) gets an inline "[RETIRED PROPERTY -- do not reuse]" marker directly
under the offending block, not just a warning on the dedicated section someone may never scroll
to. See flag_bagh_mentions().
"""
import os
import re
from html.parser import HTMLParser

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "reference", "wp-pages")
OUT = os.path.join(REPO, "reference", "site-copy.md")

TARGET_TAGS = {"h1", "h2", "h3", "h4", "p"}
HEADING_MARK = {"h1": "##", "h2": "###", "h3": "####", "h4": "#####"}

# Read order + known canonical URL + a note for pages that need one (retired property,
# duplicate URL). Filenames follow scripts/crawl_site.py's slug scheme (path with "/" -> "_").
PAGE_ORDER = [
    ("home.html", "https://mahuaresorts.com/", None),
    ("resorts_mahua-vann.html", "https://mahuaresorts.com/resorts/mahua-vann/", None),
    ("resorts_mahua-tola.html", "https://mahuaresorts.com/resorts/mahua-tola/", None),
    (
        "resorts_mahua-bagh.html",
        "https://mahuaresorts.com/resorts/mahua-bagh/",
        "RETIRED -- Mahua Bagh (Murud) is no longer part of the brand. The live site still "
        "sells it; this section is kept for completeness only. Do not reuse this copy.",
    ),
    ("about-us.html", "https://mahuaresorts.com/about-us/", None),
    ("offers.html", "https://mahuaresorts.com/offers/", None),
    ("in-the-news.html", "https://mahuaresorts.com/in-the-news/", None),
    ("terms-conditions.html", "https://mahuaresorts.com/terms-conditions/", None),
    ("work-with-us.html", "https://mahuaresorts.com/work-with-us/", None),
    ("mahuaresorts_work-with-us.html", "https://mahuaresorts.com/mahuaresorts/work-with-us/", None),
]

MAIN_OPEN_RE = re.compile(r"<main\b[^>]*>")
MAIN_CLOSE_RE = re.compile(r"</main>")


class TitleParser(HTMLParser):
    """Pulls the text of <title> only."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.parts.append(data)

    def title(self):
        return " ".join("".join(self.parts).split())


class BodyExtractor(HTMLParser):
    """Walks a fragment of HTML and collects the text of every h1-h4 / p in document order.

    script/style content is dropped even though callers already run this on a <main> fragment,
    because a few pages carry an inline <style> block inside <main>.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self._skip_depth = 0
        self._capture_tag = None
        self._capture_depth = 0
        self._buffer = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip_depth += 1
            return
        if self._skip_depth:
            return
        if self._capture_tag is None:
            if tag in TARGET_TAGS:
                self._capture_tag = tag
                self._capture_depth = 1
                self._buffer = []
        else:
            if tag == self._capture_tag:
                self._capture_depth += 1
            if tag == "br":
                self._buffer.append(" ")

    def handle_startendtag(self, tag, attrs):
        # e.g. a self-closed <br/>: treat as start immediately followed by end.
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if self._skip_depth:
            return
        if tag == "br":
            # offers.html has a stray, unmatched </br> (no opening <br>): "Pay for 2
            # nights</br><i>and</i></br>stay for 3". A browser still renders that as a line
            # break per the HTML5 spec, so a real visitor sees a space there -- match that,
            # not just the well-formed <br> case handled in handle_starttag.
            if self._capture_tag is not None:
                self._buffer.append(" ")
            return
        if self._capture_tag is not None and tag == self._capture_tag:
            self._capture_depth -= 1
            if self._capture_depth == 0:
                text = " ".join("".join(self._buffer).split())
                if text:
                    self.blocks.append((self._capture_tag, text))
                self._capture_tag = None
                self._buffer = []

    def handle_data(self, data):
        if self._skip_depth:
            return
        if self._capture_tag is not None:
            self._buffer.append(data)


def extract_title(raw_html):
    parser = TitleParser()
    parser.feed(raw_html)
    parser.close()
    return parser.title() or "(untitled)"


def extract_blocks(main_html):
    parser = BodyExtractor()
    parser.feed(main_html)
    parser.close()
    # Collapse immediately-adjacent exact duplicates (e.g. the homepage's <h1>, restated
    # verbatim as the very next paragraph, in italics). Compare TEXT only, not (tag, text):
    # the homepage case is an <h1> followed by a <p> with identical wording, so comparing the
    # full tuple never matched and both copies survived -- an adjacent identical string is
    # boilerplate regardless of which tag wraps it. Deliberately NOT a page-wide or site-wide
    # dedup: short headings like "Stay" or "Dining" legitimately recur once per resort page,
    # and room-feature lines like "Forest view" legitimately recur once per room type but are
    # never adjacent to each other (other facts sit between them) -- collapsing those would
    # delete real structure, not noise.
    collapsed = []
    for tag, text in parser.blocks:
        if collapsed and collapsed[-1][1] == text:
            continue
        collapsed.append((tag, text))
    return collapsed


RETIRED_MARKER = "**[RETIRED PROPERTY -- do not reuse]**"


def flag_bagh_mentions(blocks):
    """Indices of blocks, on a page OTHER than the dedicated Mahua Bagh section, that mention
    the retired property. Home and About Us both describe Bagh warmly in passing -- a reader
    skimming by chapter would never see the warning on the dedicated Bagh section, so every
    stray mention needs its own marker.

    A block is flagged if it names "Bagh" itself, or if it immediately follows a block that
    does -- the pattern on About Us is a short label ("Mahua Bagh, Murud") followed by its
    one-sentence description, which doesn't repeat the name. This does not chain further: the
    generic closing paragraph after that description doesn't mention Bagh and doesn't follow a
    block that does (the description itself doesn't say "Bagh"), so it is correctly left alone.
    """
    flagged = set()
    for i, (_, text) in enumerate(blocks):
        if "bagh" in text.lower():
            flagged.add(i)
        elif i > 0 and "bagh" in blocks[i - 1][1].lower():
            flagged.add(i)
    return flagged


def render_page(url, title, note, blocks, bagh_indices=frozenset()):
    lines = [f"# {title}", "", f"**Source:** {url}"]
    if note:
        lines += ["", f"> **{note}**"]
    lines.append("")
    for i, (tag, text) in enumerate(blocks):
        if tag == "p":
            lines.append(text)
        else:
            lines.append(f"{HEADING_MARK[tag]} {text}")
        lines.append("")
        if i in bagh_indices:
            lines.append(RETIRED_MARKER)
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def discover_order():
    """PAGE_ORDER plus any crawled file it doesn't already know about (new pages, feeds, etc.),
    so a re-crawl can't silently drop content -- unrecognised files just fall through the
    <main>-less skip path with a reason printed, same as feed.html/comments_feed.html today."""
    order = list(PAGE_ORDER)
    known = {fn for fn, _, _ in PAGE_ORDER}
    if os.path.isdir(SRC):
        for filename in sorted(os.listdir(SRC)):
            if filename.endswith(".html") and filename not in known:
                order.append((filename, f"https://mahuaresorts.com/ (unmapped: {filename})", None))
    return order


def main():
    out_sections = []
    toc = []
    seen_bodies = {}
    skipped = []
    total_words = 0

    for filename, url, note in discover_order():
        path = os.path.join(SRC, filename)
        if not os.path.exists(path):
            skipped.append((filename, "file not found -- run scripts/crawl_site.py"))
            continue

        with open(path, encoding="utf-8") as f:
            raw = f.read()

        m1 = MAIN_OPEN_RE.search(raw)
        m2 = MAIN_CLOSE_RE.search(raw)
        if not m1 or not m2:
            skipped.append((filename, "no <main> element -- not a content page (RSS feed etc.)"))
            continue

        blocks = extract_blocks(raw[m1.end():m2.start()])
        body_key = tuple(blocks)
        if body_key in seen_bodies:
            skipped.append((filename, f"identical body to {seen_bodies[body_key]} -- duplicate URL, skipped"))
            continue
        seen_bodies[body_key] = filename

        title = extract_title(raw)
        # Word count is body content only (headings + paragraphs) -- the page <title> is
        # metadata, not body copy, and folding it in overstated every page's total by a
        # handful of words.
        words = sum(len(text.split()) for _, text in blocks)
        total_words += words
        print(f"{filename}: {len(blocks)} blocks, {words} words")

        # The Bagh page's own note already carries its warning at the top of its section;
        # every OTHER page gets a marker inline, adjacent to each block that mentions Bagh.
        bagh_indices = frozenset() if note else flag_bagh_mentions(blocks)
        out_sections.append(render_page(url, title, note, blocks, bagh_indices))

        anchor = "-".join(title.lower().split())
        toc_line = f"- [{title}](#{anchor}) -- {url} ({words} words)"
        if note:
            toc_line += " **(RETIRED)**"
        toc.append(toc_line)

    header = (
        "<!-- Generated by scripts/extract_site_copy.py. Do not hand-edit; re-run the script "
        "instead. This is a transcript of the live mahuaresorts.com copy -- words preserved "
        "exactly, order preserved, structure marked -- for reuse as raw material, not as a "
        "finished draft. -->\n\n"
        "# Live Site Copy Transcript\n\n"
        f"{len(out_sections)} pages, {total_words} words total.\n\n"
        + "\n".join(toc)
        + "\n"
    )

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header + "\n---\n\n" + "\n---\n\n".join(out_sections))

    print(f"\n{len(out_sections)} pages written, {total_words} words total -> {OUT}")
    if skipped:
        print("\nskipped:")
        for fn, reason in skipped:
            print(f"  {fn}: {reason}")


if __name__ == "__main__":
    main()
