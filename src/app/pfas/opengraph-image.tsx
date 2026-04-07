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
                backgroundColor: "#a855f7",
              }}
            />
            <div style={{ display: "flex", fontSize: 14, color: "#a855f7" }}>Live Tracker</div>
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
                color: "#a855f7",
              }}
            >
              PFAS in UK Water
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#9ca3af", marginTop: 16 }}>
              Environment Agency monitoring data
            </div>
            {summary && (
              <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {summary.totalDetections}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
                    Detections
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {summary.citiesWithDetections}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
                    Cities affected
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {summary.totalSamplingPoints}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
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
          <div style={{ display: "flex", fontSize: 16, color: "#6b7280" }}>
            Forever chemicals tracker
          </div>
          <div style={{ display: "flex", fontSize: 16, color: "#9ca3af" }}>
            Check yours → tapwater.uk/pfas
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
