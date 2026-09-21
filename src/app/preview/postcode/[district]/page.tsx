import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import { PostcodeTank } from "@/components/tank/postcode-tank";
import { loadPostcodePage } from "@/lib/postcode-page-load";

/**
 * Review copy of the redesigned postcode page, on real data, for sign-off before it
 * replaces /postcode/[district]. Not indexed, not in the sitemap, blocked in robots.
 */

const display = Red_Hat_Display({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-rhd", display: "swap" });
const text = Red_Hat_Text({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-rht", display: "swap" });

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Postcode page preview",
  robots: { index: false, follow: false },
};

export default async function PostcodePreviewPage({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const page = await loadPostcodePage(district);
  if (!page || !page.hasData) notFound();
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <PostcodeTank page={page} />
    </div>
  );
}
