# Animations & scroll effects on thesujanlife.com (Home page)

## Site-wide effects

**1. Smooth "gliding" scroll** — The whole site uses buttery, slightly delayed scrolling (a technique called "smooth scroll"). When you scroll, the page glides and eases to a stop instead of moving in hard jumps. This is what gives the site its luxurious, floaty feel.

**2. Page-load fade-in** — When the page first opens, everything appears gently: the SUJÁN logo, the menu, the Book Now button, and the big headline all softly fade into view rather than just popping up.

**3. Sticky navigation bar** — The top bar (logo, Menu, Book Now) stays pinned to the top of the screen the entire time you scroll. The "MENU" button only appears once you start scrolling down.

## Hero (top of the page)

**4. Headline fade-out on scroll** — The big opening line "Exceptional experiences connecting you to the soul of India." dissolves away line by line as you begin scrolling, making room for the next message.

**5. Scroll-controlled "text fill" effect** — The next sentence ("Experiences for the connoisseur, the adventurous, and those looking for the extraordinary.") starts out in a pale, faint grey and its words progressively darken to full strength as you scroll — as if the text is being "inked in" by your scrolling. Key words (connoisseur, adventurous, the extraordinary) stay in a different softer shade for emphasis.

**6. Hand-drawn tent sketch reveal** — A delicate pencil-sketch illustration of a safari tent fades in on the right side and drifts along as you scroll — a decorative touch.

**7. Paragraph fade-in** — The small paragraph ("To live the SUJÁN life...") also brightens from faint to fully readable as it enters the screen.

## Full-width video section (leopard scene)

**8. Background video** — A full-width, automatically playing, looping film of the wilderness (with a leopard) — constant gentle motion even when you're not scrolling.

**9. Zoom-in reveal on scroll** — The video area starts slightly shrunken (about 80% size) and grows to full size as it comes into view — a subtle "opening up" effect. The footage inside also slowly magnifies (up to 1.5×) as you scroll through the section, creating a cinematic depth/parallax feel.

**10. Quote revealed line by line** — The Tatler Magazine quote written over the video appears one line at a time, in sync with your scrolling, as if being unveiled.

## "Our Collection" section

**11. Cards fading into view** — The three property photos (Jawai, The Serai, Sher Bagh) fade/slide in when the section enters the screen.

**12. Draggable card row** — The three cards sit in a slider you can grab and drag sideways with your mouse or finger (most noticeable on smaller screens).

## "A legacy of conservation" section (the long one)

**13. Pinned text with floating photo collage** — This is the most elaborate scroll effect on the page. The centre text ("A legacy of conservation woven through generations") **stays frozen in place** for a long stretch of scrolling, while old family and wildlife photographs (black-and-white archive shots, a tiger, camp landscapes) float up past it on the left and right sides, each moving at slightly different speeds. It feels like a memory album drifting by around a still headline.

## Map section ("Discover the wilderness of Rajasthan")

**14. Section fade-in** — The heading (again with softly-coloured highlight words like "wilderness"), the paragraph, buttons, and the illustrated map of Rajasthan all ease into view as you arrive.

## Press logos strip

**15. Auto-scrolling logo ticker (marquee)** — The magazine logos (AFAR, Country Life, Tatler, Brides, etc.) slide sideways continuously on their own in an endless loop — no scrolling needed.

## Menu & buttons (interaction animations)

**16. Full-screen curtain menu** — Clicking "MENU" slides a full-screen panel down from the top like a curtain, with the navigation links inside; the word "MENU" itself crossfades into "CLOSE" with an X.

**17. Hover effects** — Buttons (Book Now, Sign Up, Contact Us, arrows) smoothly change their background/text colour when you hover over them, and navigation links dim slightly. The colour changes are eased (gradual), not instant.

---

### What's powering all this (in one sentence each)

The site is built in **Webflow**. The fancy effects come from a custom animation script using **GSAP with ScrollTrigger** (the industry-standard tool for tying animations to scroll position — used for the pinned section, text fills, line reveals, and zooms), **Lenis** (the smooth-scroll glide), **SplitText** (chops text into lines/words so they can animate individually), and **Swiper** (the draggable card row).
