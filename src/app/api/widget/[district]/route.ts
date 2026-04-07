import { NextRequest, NextResponse } from "next/server";
import { getPostcodeData } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
  const data = await getPostcodeData(district.toUpperCase());

  if (!data) {
    return NextResponse.json({ error: "Postcode not found" }, { status: 404 });
  }

  // Return only what the widget needs — no sensitive data
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
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
