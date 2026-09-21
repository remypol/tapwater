import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";

/** The two faces of the redesigned templates, exposed as --font-rhd and --font-rht. */
const display = Red_Hat_Display({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-rhd", display: "swap" });
const text = Red_Hat_Text({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-rht", display: "swap" });

export const tankFonts = `${display.variable} ${text.variable}`;
