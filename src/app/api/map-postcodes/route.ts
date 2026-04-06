import { NextResponse } from "next/server";
import { getMapPostcodes } from "@/lib/data";

export async function GET() {
  const postcodes = await getMapPostcodes();
  return NextResponse.json(postcodes, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
