import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TapWater.uk — Check your tap water quality by postcode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          padding: 80,
          justifyContent: "space-between",
        }}
      >
        {/* Top: logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              backgroundColor: "#0a5cf5",
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            💧
          </div>
          <span style={{ fontSize: 28, color: "#b9c8ea", letterSpacing: -0.5 }}>
            tapwater.uk
          </span>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: "#ffffff",
            }}
          >
            What&apos;s in your
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: "#0a5cf5",
            }}
          >
            tap water?
          </div>
          <div style={{ fontSize: 24, color: "#b9c8ea", marginTop: 8 }}>
            Free water quality reports for every UK postcode
          </div>
        </div>

        {/* Bottom: stats */}
        <div style={{ display: "flex", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0a5cf5" }}>
              2,800+
            </span>
            <span style={{ fontSize: 16, color: "#8ea0cc" }}>postcodes</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0a5cf5" }}>
              50+
            </span>
            <span style={{ fontSize: 16, color: "#8ea0cc" }}>contaminants</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0a5cf5" }}>
              16
            </span>
            <span style={{ fontSize: 16, color: "#8ea0cc" }}>water companies</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
