"""Extract plain text from the strategy .docx files in the parent folder.

Run from the repo root:  python scripts/extract_docx.py

Writes reference/docs-text/<name>.txt so the audit documents are greppable and readable
without Word. Source documents:

  01_Mahua_Website_Analysis_and_Observations.docx   audit of the current site
  02_Mahua_Website_Feedback_and_Improvements.docx   recommended fixes
  03_Mahua_Priority_Action_Roadmap.docx             phased plan
  04_Mahua_Benchmark_Brands_and_What_to_Copy.docx   the ten benchmark sites
"""
import html
import os
import re
import zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.dirname(REPO)
OUT = os.path.join(REPO, "reference", "docs-text")


def docx_to_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", "ignore")
    text = xml.replace("</w:p>", "\n")
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text)


def main():
    os.makedirs(OUT, exist_ok=True)
    found = 0
    for fn in sorted(os.listdir(SRC)):
        if not fn.lower().endswith(".docx") or fn.startswith("~$"):
            continue
        text = docx_to_text(os.path.join(SRC, fn))
        dest = os.path.join(OUT, os.path.splitext(fn)[0] + ".txt")
        with open(dest, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"{fn} -> {len(text)} chars")
        found += 1
    if not found:
        print(f"no .docx files found in {SRC}")


if __name__ == "__main__":
    main()
