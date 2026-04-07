import { getStoryCsv, PRESS_SLUGS } from "@/lib/press-data";

export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!PRESS_SLUGS.includes(slug)) {
    return new Response("Not found", { status: 404 });
  }

  const csv = await getStoryCsv(slug);

  if (!csv) {
    return new Response("Data unavailable", { status: 503 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tapwater-${slug}-2026.csv"`,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
