import { Cinzel, Cormorant_Garamond, Crimson_Pro } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400"], variable: "--font-display", display: "swap",
});
export const label = Cinzel({
  subsets: ["latin"], weight: ["400", "500"], variable: "--font-label", display: "swap",
});
export const body = Crimson_Pro({
  subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-body", display: "swap",
});
