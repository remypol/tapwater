import { NextRequest, NextResponse } from "next/server";
import { getPostcodeData } from "@/lib/data";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Handle CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
  const data = await getPostcodeData(district.toUpperCase());

  if (!data) {
    return NextResponse.json({ error: "Postcode not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const widget = {
    district: data.district,
    areaName: data.areaName,
    score: data.safetyScore,
    grade: data.scoreGrade,
    contaminantsTested: data.contaminantsTested,
    contaminantsFlagged: data.contaminantsFlagged,
    supplier: data.supplier,
    lastUpdated: data.lastUpdated,
    url: `https://www.tapwater.uk/postcode/${data.district}`,
  };

  return NextResponse.json(widget, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
