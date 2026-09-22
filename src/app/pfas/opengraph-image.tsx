import { ImageResponse } from "next/og";
import { getPfasNationalSummary } from "@/lib/pfas-data";

export const runtime = "edge";
export const alt = "PFAS in UK Water";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const summary = await getPfasNationalSummary();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#031349",
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
          <div style={{ display: "flex", fontSize: 24, color: "#b9c8ea" }}>tapwater.uk</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#2e1a47",
              borderRadius: 8,
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#69b7ff",
              }}
            />
            <div style={{ display: "flex", fontSize: 14, color: "#69b7ff" }}>Live Tracker</div>
          </div>
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
          {/* Left: Title */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#69b7ff",
              }}
            >
              PFAS in UK Water
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#b9c8ea", marginTop: 16 }}>
              Environment Agency monitoring data
            </div>
            {summary && (
              <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#69b7ff" }}>
                    {summary.totalDetections}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#8ea0cc" }}>
                    Detections
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#69b7ff" }}>
                    {summary.citiesWithDetections}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#8ea0cc" }}>
                    Cities affected
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#69b7ff" }}>
                    {summary.totalSamplingPoints}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#8ea0cc" }}>
                    Sampling points
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <div style={{ display: "flex", fontSize: 16, color: "#8ea0cc" }}>
            Forever chemicals tracker
          </div>
          <div style={{ display: "flex", fontSize: 16, color: "#b9c8ea" }}>
            Check yours → tapwater.uk/pfas
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
