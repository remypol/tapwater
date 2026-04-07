import { ImageResponse } from "next/og";
import { getPfasCityData } from "@/lib/pfas-data";

export const runtime = "edge";
export const alt = "PFAS city water report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const data = await getPfasCityData(citySlug);

  if (!data) {
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

  const hasDetections = data.pfasDetected && data.detectionCount > 0;

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
            <div style={{ display: "flex", fontSize: 14, color: "#a855f7" }}>PFAS Tracker</div>
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
          {/* Left: City info */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#a855f7",
              }}
            >
              PFAS in {data.city} Water
            </div>
            {hasDetections ? (
              <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {data.compoundsDetected.length}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
                    Compounds detected
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {data.highestLevel.toFixed(3)}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
                    Highest level (µg/L)
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#a855f7" }}>
                    {data.samplingPointCount}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, color: "#6b7280" }}>
                    Sampling points
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: "#16a34a",
                  marginTop: 24,
                  fontWeight: 600,
                }}
              >
                No PFAS Detected
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
            {hasDetections
              ? `${data.detectionCount} PFAS detections in ${data.city}`
              : `No PFAS detections recorded in ${data.city}`}
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
