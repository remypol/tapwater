'use client';

/**
 * Animated water surface — flows at the bottom of the hero section.
 *
 * Three layered SVG wave paths with slightly different speeds and
 * opacities. Each layer uses width:200% with the SVG repeated via
 * background — the CSS translateX(-50%) animation creates seamless
 * infinite horizontal scrolling.
 *
 * Respects prefers-reduced-motion via CSS.
 */

function Wave({ className, fill }: { className: string; fill: string }) {
  return (
    <div className={`water-wave ${className}`}>
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '50%', height: '100%', display: 'inline-block', verticalAlign: 'bottom' }}
      >
        <path
          d={className.includes('wave-1')
            ? "M0,38 C80,42 160,50 280,48 C400,46 480,34 600,30 C720,26 800,38 920,44 C1040,50 1160,46 1280,40 C1360,36 1400,32 1440,34 L1440,70 L0,70 Z"
            : className.includes('wave-2')
              ? "M0,42 C120,50 200,54 340,50 C480,46 560,28 720,24 C880,20 1000,40 1120,46 C1240,52 1360,48 1440,42 L1440,70 L0,70 Z"
              : "M0,36 C100,44 240,52 380,50 C520,48 640,30 780,26 C920,22 1060,38 1200,46 C1320,52 1400,48 1440,44 L1440,70 L0,70 Z"
          }
          fill={fill}
        />
      </svg>
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '50%', height: '100%', display: 'inline-block', verticalAlign: 'bottom' }}
      >
        <path
          d={className.includes('wave-1')
            ? "M0,38 C80,42 160,50 280,48 C400,46 480,34 600,30 C720,26 800,38 920,44 C1040,50 1160,46 1280,40 C1360,36 1400,32 1440,34 L1440,70 L0,70 Z"
            : className.includes('wave-2')
              ? "M0,42 C120,50 200,54 340,50 C480,46 560,28 720,24 C880,20 1000,40 1120,46 C1240,52 1360,48 1440,42 L1440,70 L0,70 Z"
              : "M0,36 C100,44 240,52 380,50 C520,48 640,30 780,26 C920,22 1060,38 1200,46 C1320,52 1400,48 1440,44 L1440,70 L0,70 Z"
          }
          fill={fill}
        />
      </svg>
    </div>
  );
}

export function WaterSurface() {
  return (
    <div className="water-surface" aria-hidden="true">
      <Wave className="water-wave-1" fill="var(--color-wave-deep)" />
      <Wave className="water-wave-2" fill="var(--color-wave-mid)" />
      <Wave className="water-wave-3" fill="var(--color-wave-surface)" />
    </div>
  );
}
