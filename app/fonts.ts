import { Cinzel, Cormorant_Garamond, Crimson_Pro, Gilda_Display } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400"], variable: "--font-display", display: "swap",
});
export const heading = Gilda_Display({
  subsets: ["latin"], weight: "400", variable: "--font-heading", display: "swap",
});
export const label = Cinzel({
  subsets: ["latin"], weight: ["400", "500"], variable: "--font-label", display: "swap",
});
export const body = Crimson_Pro({
  subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"],
  variable: "--font-body", display: "swap",
});
