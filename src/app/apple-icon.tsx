import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c1220",
          borderRadius: 38,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 512 512"
          fill="none"
        >
          <path
            d="M256 80C256 80 128 224 128 312C128 382.692 185.308 440 256 440C326.692 440 384 382.692 384 312C384 224 256 80 256 80Z"
            fill="#0891b2"
          />
          <circle
            cx="256"
            cy="296"
            r="88"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="22"
            opacity="0.9"
          />
          <circle cx="228" cy="264" r="24" fill="white" opacity="0.35" />
          <line
            x1="322"
            y1="362"
            x2="378"
            y2="418"
            stroke="#0891b2"
            strokeWidth="22"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
