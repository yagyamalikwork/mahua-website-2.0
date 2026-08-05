/**
 * The ink tiger — a field-guide sketch that draws itself onto the page, lives for
 * a while, and then dozes.
 *
 * ## Why it is couchant, and stroke only
 *
 * **Couchant** — lying with the head up — because the tiger no longer walks. The
 * original spec had it pad in from the edge and cross the screen, which needs the
 * animal built as ~20 separately-pivoting parts moving in a correct four-beat
 * gait; a gait that is slightly wrong reads as cheap instantly, and that was the
 * one outcome worth avoiding at any cost (client decision, 5 Aug 2026). A cat
 * already settled is the honest shape for something that arrives, performs and
 * dozes, and it is a far more forgiving drawing.
 *
 * **Stroke only, no fills.** This is risk control rather than taste: because the
 * lines ink themselves in sequence, what a visitor watches is *a drawing being
 * made*, and that reads as a sketch. A sketch forgives a wobble that a filled
 * silhouette does not.
 *
 * ## The order matters as much as the shapes
 *
 * `ink` is the wave each stroke belongs to, and the waves are the order a hand
 * would work in: the back line that defines the whole animal, then the head, then
 * the near foreleg, then the haunch and the ground, then the tail, then the ears,
 * then the eye, and the stripes last. An outline arriving after its own markings
 * reads as assembly.
 *
 * Nothing that moves is in the final wave — the living animations begin when the
 * ink finishes, and a part still arriving would jump.
 *
 * ## Swap point
 *
 * If this is rejected, only this file changes. `components/signature/InkTiger.tsx`
 * never sees the geometry, and `lib/tiger-art.test.ts` holds a replacement to the
 * same guarantees. **No test here can judge whether it looks like a tiger** — that
 * is `docs/reviews/2026-08-05-signature/tiger.png` and a pair of eyes.
 */

export type TigerPart = "chest" | "tail" | "ear-near" | "ear-far" | "eye";

export type TigerPath = {
  /** The `d` attribute. One continuous stroke — never lifts the pen. */
  d: string;
  /** Which wave of the drawing this belongs to, 0-based. */
  ink: number;
  /**
   * Stroke weight, as a multiple of the base width the component sets. Default 1.
   *
   * Not decoration. A drawing in one uniform line reads as a diagram, because a
   * hand presses harder on the strokes that carry the form and lighter on the
   * ones that decorate it. The body lines are heavier than the stripes for the
   * same reason a draughtsman's would be.
   */
  weight?: number;
  /** Set only on the parts that move; matches a keyframe in `app/globals.css`. */
  part?: TigerPart;
};

/** Facing left, lying down, feet on the ground line at y≈236. */
export const TIGER_VIEWBOX = "0 0 400 260";

export const TIGER_PATHS: readonly TigerPath[] = [
  // ---- 0. The line that defines the animal: nape, shoulder, back, hip. ----
  //
  // It dips behind the shoulder and rises again over the hip. A single smooth
  // arc here was the first attempt's undoing — it made the body a tube, and a
  // tube with a round head on it is not a cat.
  { d: "M104 108 C 130 110, 152 120, 170 138 C 214 152, 264 150, 300 136", ink: 0, weight: 1.35 },

  // ---- 1. The head: skull and brow, then muzzle and jaw, then the ruff. ----
  //
  // A wedge, not a circle. Broad across the cheeks and tapering to a blunt
  // muzzle — the first attempt drew a ball, which read as a bear cub.
  { d: "M104 108 C 100 84, 86 70, 66 72 C 52 74, 44 86, 42 100", ink: 1, weight: 1.2 },
  { d: "M42 100 C 34 104, 32 116, 40 122 C 42 132, 48 140, 58 143", ink: 1, weight: 1.2 },
  { d: "M58 143 C 74 150, 94 146, 102 134 C 108 126, 106 116, 104 108", ink: 1, weight: 1.2 },
  { d: "M38 112 C 42 109, 48 110, 50 114", ink: 1, weight: 0.8 },

  // ---- 2. Throat, chest, and the forelegs stretched out in front. ----
  // The chest drops from the ruff and swells before the elbow — a cat at rest
  // carries its weight here, and a straight line from jaw to leg is what made the
  // earlier attempts read as a caterpillar.
  { d: "M100 140 C 112 158, 122 176, 132 196", ink: 2, weight: 1.2, part: "chest" },
  { d: "M132 196 C 126 214, 106 228, 80 233 C 70 235, 60 235, 52 233", ink: 2, weight: 1.2 },
  { d: "M52 233 C 44 231, 43 223, 51 219", ink: 2 },
  // The far foreleg, behind and a little lower — what gives the front depth.
  { d: "M156 208 C 146 224, 124 234, 100 238 C 90 239, 82 239, 76 237", ink: 2, weight: 0.85 },

  // ---- 3. The haunch, the ground, and the folded hind leg. ----
  //
  // The haunch is the second mass of the animal and has to read as one: a big
  // rounded thigh sitting proud of the back line, not a taper into the tail.
  { d: "M300 136 C 330 138, 350 160, 352 192 C 354 218, 340 236, 314 239", ink: 3, weight: 1.35 },
  { d: "M314 239 C 258 245, 198 245, 148 239", ink: 3, weight: 1.2 },
  { d: "M340 198 C 320 206, 300 216, 290 230", ink: 3, weight: 0.85 },
  { d: "M290 230 C 280 234, 276 240, 284 243", ink: 3 },

  // ---- 4. The tail, curling out behind and forward along the ground. ----
  { d: "M352 194 C 374 204, 384 226, 374 240 C 364 252, 342 250, 334 242", ink: 4, weight: 1.1, part: "tail" },

  // ---- 5. The ears, small and rounded and set wide. ----
  { d: "M60 74 C 56 62, 66 54, 76 60 C 82 64, 84 71, 82 78", ink: 5, part: "ear-near" },
  { d: "M88 68 C 92 57, 102 53, 108 61 C 112 67, 110 76, 106 82", ink: 5, weight: 0.85, part: "ear-far" },

  // ---- 6. The eye. One almond, because this is a profile — drawn as a closed
  //         stroke so a blink can squash it about its own centre.
  { d: "M48 96 C 53 91, 63 91, 68 96 C 63 102, 53 102, 48 96", ink: 6, weight: 0.9, part: "eye" },

  // ---- 7. The stripes, last.
  //
  // Short, and set *inside* the silhouette rather than starting on the back line
  // — the first attempt hung them off the spine and the animal looked combed.
  // Each follows the body's cross-section, which is what makes a mark sit on a
  // flank instead of over it.
  // They are also short. A stripe reaching most of the way down the flank is a
  // rung, and six rungs make a ladder — which is what the first two attempts
  // built.
  { d: "M186 150 C 190 162, 190 172, 187 181", ink: 7, weight: 0.7 },
  { d: "M211 154 C 215 166, 215 176, 212 185", ink: 7, weight: 0.7 },
  { d: "M236 155 C 240 167, 240 177, 237 186", ink: 7, weight: 0.7 },
  { d: "M261 153 C 265 165, 265 175, 262 184", ink: 7, weight: 0.7 },
  { d: "M286 148 C 290 160, 290 170, 287 179", ink: 7, weight: 0.7 },
  { d: "M310 150 C 315 161, 316 171, 313 180", ink: 7, weight: 0.7 },
  // Two over the shoulder, where the neck meets the back.
  { d: "M146 126 C 151 136, 151 145, 148 153", ink: 7, weight: 0.7 },
  { d: "M164 138 C 169 149, 169 158, 166 166", ink: 7, weight: 0.7 },
  // Three on the face — brow, cheek, muzzle. These are what make a head read as
  // a tiger's rather than as any cat's.
  { d: "M54 84 C 62 82, 71 83, 77 86", ink: 7, weight: 0.7 },
  { d: "M45 104 C 52 102, 61 103, 66 106", ink: 7, weight: 0.7 },
  { d: "M50 131 C 57 129, 65 130, 70 133", ink: 7, weight: 0.7 },
  // And two rings on the tail.
  { d: "M364 212 C 368 217, 370 223, 368 229", ink: 7, weight: 0.7 },
  { d: "M376 230 C 378 234, 378 239, 375 243", ink: 7, weight: 0.7 },
];
