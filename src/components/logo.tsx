/**
 * TapWater.uk Logo — "The Drop Lens"
 *
 * Water drop doubles as magnifying glass — research meets purity.
 * "tap" in dark ink, "water" in brand blue, ".uk" smaller below.
 */

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showText?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: "text-lg", uk: "text-[9px]" },
  md: { icon: 36, text: "text-xl", uk: "text-[10px]" },
  lg: { icon: 48, text: "text-3xl", uk: "text-xs" },
};

export function DropLensIcon({
  size = 36,
  variant = "light",
}: {
  size?: number;
  variant?: "light" | "dark";
}) {
  const dropFill = variant === "dark" ? "#67b8d6" : "#0891b2";
  const lensFill = variant === "dark" ? "#a3dced" : "#22d3ee";
  const handleStroke = variant === "dark" ? "#67b8d6" : "#0891b2";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Water drop shape */}
      <path
        d="M24 4C24 4 10 20 10 30C10 37.732 16.268 44 24 44C31.732 44 38 37.732 38 30C38 20 24 4 24 4Z"
        fill={dropFill}
      />
      {/* Magnifying glass circle (lens) */}
      <circle
        cx="24"
        cy="28"
        r="9"
        fill="none"
        stroke={lensFill}
        strokeWidth="2.5"
        opacity="0.9"
      />
      {/* Lens highlight */}
      <circle
        cx="21"
        cy="25"
        r="2.5"
        fill="white"
        opacity="0.4"
      />
      {/* Magnifying glass handle */}
      <line
        x1="30.5"
        y1="34.5"
        x2="36"
        y2="40"
        stroke={handleStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = "md", variant = "light", showText = true }: LogoProps) {
  const s = SIZES[size];
  const inkColor = variant === "dark" ? "text-white" : "text-ink";
  const waterColor = variant === "dark" ? "text-[#67b8d6]" : "text-accent";
  const ukColor = variant === "dark" ? "text-[#67b8d6]/60" : "text-accent/60";

  return (
    <span className="inline-flex items-center gap-2">
      <DropLensIcon size={s.icon} variant={variant} />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`${s.text} font-bold tracking-tight`}>
            <span className={inkColor}>tap</span>
            <span className={waterColor}>water</span>
          </span>
          <span className={`${s.uk} ${ukColor} tracking-[0.25em] font-medium mt-0.5`}>
            .uk
          </span>
        </span>
      )}
    </span>
  );
}
