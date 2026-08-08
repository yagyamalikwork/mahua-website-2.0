// Full-page captures of the two property pages at the project's four review
// widths — the evidence half of "verify by running the page, not by asserting
// it works". Writes into docs/reviews/2026-08-08-property-pages/.
//
//   npx next start -p 3100 &
//   node scripts/capture_property_pages.mjs [--port 3100]

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = flag("port", "3100");
const OUT = flag("out", "docs/reviews/2026-08-08-property-pages");

const ROUTES = ["mahua-vann", "mahua-tola"];
const WIDTHS = [390, 768, 1440, 1920];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 900 },
      });
      const page = await context.newPage();
      await page.goto(`http://localhost:${PORT}/${route}`, { waitUntil: "networkidle" });
      // Walk the page so every lazy image loads and every entrance settles
      // before the capture — a full-page shot of an unscrolled page would
      // show staged (invisible) entrances below the fold.
      await page.evaluate(async () => {
        const step = window.innerHeight / 2;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      const file = path.join(OUT, `${route}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
      await context.close();
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
