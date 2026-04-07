import { ImageResponse } from "next/og";
import { getPostcodeData, getAllPostcodeDistricts } from "@/lib/data";
import { getCityBySlug } from "@/lib/cities";
import type { PostcodeData } from "@/lib/types";

export const runtime = "edge";
export const alt = "City water quality summary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getPostcodesForCity(
  matches: string[],
): Promise<PostcodeData[]> {
  const lowerMatches = matches.map((m) => m.toLowerCase());
  const districts = await getAllPostcodeDistricts();
  const results: PostcodeData[] = [];

  for (const d of districts) {
    const data = await getPostcodeData(d);
    if (data && lowerMatches.includes(data.city.toLowerCase())) {
      results.push(data);
    }
  }

  return results;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#0c0f17",
            color: "#ffffff",
            fontFamily: "sans-serif",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: "#9ca3af" }}>tapwater.uk</div>
          <div style={{ display: "flex", fontSize: 22, color: "#6b7280" }}>City not found</div>
        </div>
      ),
      { ...size },
    );
  }

  const allPostcodes = await getPostcodesForCity(city.matches);
  const scored = allPostcodes.filter((p) => p.safetyScore >= 0);
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, p) => sum + p.safetyScore, 0) / scored.length
      : 0;

  // Primary supplier (most common)
  const supplierCounts = new Map<string, { name: string; count: number }>();
  for (const p of allPostcodes) {
    const existing = supplierCounts.get(p.supplierId);
    if (existing) {
      existing.count++;
    } else {
      supplierCounts.set(p.supplierId, { name: p.supplier, count: 1 });
    }
  }
  const primarySupplier = Array.from(supplierCounts.values()).sort(
    (a, b) => b.count - a.count,
  )[0]?.name ?? "Unknown";

  const scoreColor =
    avgScore >= 7 ? "#16a34a" : avgScore >= 5 ? "#d97706" : "#dc2626";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0c0f17",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: "#9ca3af" }}>tapwater.uk</div>
          <div style={{ display: "flex", fontSize: 16, color: "#6b7280" }}>City Water Quality</div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 60,
          }}
        >
          {/* Left: City info */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {city.name}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#9ca3af", marginTop: 12 }}>
              {scored.length} postcode areas tested
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#6b7280", marginTop: 4 }}>
              {primarySupplier}
            </div>
          </div>

          {/* Right: Score */}
          {scored.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 120,
                  fontWeight: 700,
                  color: "#0891b2",
                  lineHeight: 1,
                }}
              >
                {avgScore.toFixed(1)}
              </div>
              <div style={{ display: "flex", fontSize: 28, color: "#6b7280", marginTop: 4 }}>
                /10
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: scoreColor,
                  marginTop: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Average Safety Score
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", fontSize: 28, color: "#6b7280" }}>
                No Data Yet
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #1e293b",
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", fontSize: 16, color: "#6b7280" }}>
            {scored.length > 0
              ? `${city.name} water quality report`
              : "Limited monitoring data available"}
          </div>
          <div style={{ display: "flex", fontSize: 16, color: "#9ca3af" }}>
            Check yours → tapwater.uk
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
