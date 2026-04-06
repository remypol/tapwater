export default function PostcodeLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated water drop */}
      <div className="relative">
        <svg
          viewBox="0 0 60 80"
          width={60}
          height={80}
          className="animate-bounce"
          style={{ animationDuration: "1.4s" }}
        >
          {/* Drop shape */}
          <path
            d="M30 4 C30 4 6 40 6 54 C6 67.25 16.75 78 30 78 C43.25 78 54 67.25 54 54 C54 40 30 4 30 4Z"
            fill="var(--color-accent, #0891b2)"
            opacity={0.15}
          />
          {/* Water fill — animated via CSS */}
          <clipPath id="drop-clip">
            <path d="M30 4 C30 4 6 40 6 54 C6 67.25 16.75 78 30 78 C43.25 78 54 67.25 54 54 C54 40 30 4 30 4Z" />
          </clipPath>
          <rect
            x={0}
            y={30}
            width={60}
            height={50}
            fill="var(--color-accent, #0891b2)"
            opacity={0.4}
            clipPath="url(#drop-clip)"
          >
            <animate
              attributeName="y"
              values="70;30;70"
              dur="2s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
          </rect>
          {/* Drop outline */}
          <path
            d="M30 4 C30 4 6 40 6 54 C6 67.25 16.75 78 30 78 C43.25 78 54 67.25 54 54 C54 40 30 4 30 4Z"
            fill="none"
            stroke="var(--color-accent, #0891b2)"
            strokeWidth={2.5}
            opacity={0.5}
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-ink">Loading water report</p>
        <p className="text-xs text-muted mt-1">Fetching the latest data for this area</p>
      </div>
    </div>
  );
}
