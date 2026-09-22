import type { Bubble } from "@/lib/tank-plan";
import { formatReading } from "@/lib/tank-plan";

/**
 * Every tested substance as a bubble in a column of water. Height is the share of
 * its legal limit, so the one that matters is the one nearest the surface. Every
 * bubble carries its own name and percentage, so nothing needs a tap to be read: on
 * wide screens the labels fan out beside the bubbles, on phones the chart stacks into
 * a labelled list. Server-rendered SVG, no JavaScript.
 */

const W = 1000;
const H = 460;
const PAD_L = 72; // room for the y-axis
const PAD_R = 24;
const LIMIT_Y = 70; // where a result at 100% of its limit sits
const FLOOR_Y = 404;
const SPAN = FLOOR_Y - LIMIT_Y;

function pct(share: number): string {
  if (share <= 0) return "0%";
  if (share < 0.01) return "<1%";
  return `${Math.round(share * 100)}%`;
}

function paint(share: number): { fill: string; ring: string; text: string } {
  if (share > 1) return { fill: "url(#wt-b-over)", ring: "#ffb4ae", text: "#ffb4ae" };
  if (share >= 0.75) return { fill: "url(#wt-b-hot)", ring: "#ffe38a", text: "#ffd23f" };
  return { fill: "url(#wt-b-air)", ring: "rgba(255,255,255,0.7)", text: "#ffffff" };
}

/** Spread the biggest bubbles across the width instead of bunching them at one end. */
function slotOrder(count: number): number[] {
  const slots: number[] = [];
  let left = Math.floor((count - 1) / 2);
  let right = left + 1;
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) slots.push(left--);
    else slots.push(right++);
  }
  return slots;
}

export function BubbleColumn({ bubbles }: { bubbles: Bubble[] }) {
  if (bubbles.length === 0) return null;
  const slots = slotOrder(bubbles.length);
  const closest = bubbles[0];
  const clear = bubbles.filter((b) => b.share < 0.25).length;
  const cols = bubbles.length;
  const colW = (W - PAD_L - PAD_R) / cols;

  const placed = bubbles.map((b, i) => {
    const x = PAD_L + (slots[i] + 0.5) * colW;
    const r = 14 + Math.min(b.share, 1) * 30;
    const y = FLOOR_Y - Math.min(b.share, 1.1) * SPAN;
    return { b, x, y, r, i };
  });

  // Labels: alternate above/below the bubble by slot parity so neighbours never collide.
  const label = (p: (typeof placed)[number]) => {
    const above = slots[p.i] % 2 === 0;
    const ly = above ? p.y - p.r - 14 : p.y + p.r + 22;
    return { ly, above };
  };

  return (
    <figure className="wt-glass">
      <p className="wt-limits-cap wt-nums">
        {closest.share > 1 ? (
          <><strong>{closest.name}</strong> is over its legal limit, at {pct(closest.share)} of it.</>
        ) : (
          <><strong>{closest.name}</strong> came closest to a limit, at {pct(closest.share)} of it. {clear} of {cols} substances used under a quarter of theirs.</>
        )}
      </p>

      <svg className="wt-glass-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${cols} substances plotted by share of their legal limit, from ${closest.name} at ${pct(closest.share)} down.`}>
        <defs>
          <linearGradient id="wt-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f4ad1" />
            <stop offset="1" stopColor="#062a8a" />
          </linearGradient>
          <radialGradient id="wt-b-air" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="0.7" stopColor="#8fc0ff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="wt-b-hot" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.22" stopColor="#fff1b3" />
            <stop offset="0.75" stopColor="#ffd23f" />
            <stop offset="1" stopColor="#ffb800" />
          </radialGradient>
          <radialGradient id="wt-b-over" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.22" stopColor="#ffc2bd" />
            <stop offset="0.75" stopColor="#ff5a4f" />
            <stop offset="1" stopColor="#d92c20" />
          </radialGradient>
          <filter id="wt-b-shadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#020c33" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* the column of water */}
        <rect x="0" y="0" width={W} height={H} rx="28" fill="url(#wt-water)" />

        {/* y-axis: 0, 25, 50, 75, limit */}
        {[0, 0.25, 0.5, 0.75].map((s) => {
          const y = FLOOR_Y - s * SPAN;
          return (
            <g key={s}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#ffffff" strokeOpacity={s === 0 ? 0.25 : 0.12} />
              <text x={PAD_L - 12} y={y + 4} textAnchor="end" fontSize="13" fill="#a9c4ff" fontWeight="600">{Math.round(s * 100)}%</text>
            </g>
          );
        })}
        <line x1={PAD_L} x2={W - PAD_R} y1={LIMIT_Y} y2={LIMIT_Y} stroke="#ffd23f" strokeWidth="3" strokeDasharray="10 8" />
        <text x={PAD_L - 12} y={LIMIT_Y + 5} textAnchor="end" fontSize="13" fill="#ffd23f" fontWeight="800">limit</text>
        <text x={W - PAD_R} y={LIMIT_Y - 12} textAnchor="end" fontSize="14" fill="#ffd23f" fontWeight="800">Legal limit</text>

        {/* bubbles, smallest drawn first so the big ones sit on top */}
        {[...placed].sort((a, c) => a.r - c.r).map((p) => {
          const { fill, ring, text } = paint(p.b.share);
          const { ly, above } = label(p);
          const lx = p.x;
          return (
            <g key={p.b.name} className="wt-glass-b">
              <title>{`${p.b.name}: ${formatReading(p.b.value)} ${p.b.unit}, ${pct(p.b.share)} of the ${formatReading(p.b.limit)} ${p.b.unit} limit`}</title>
              <line x1={p.x} y1={above ? p.y - p.r : p.y + p.r} x2={lx} y2={above ? ly + 4 : ly - 12} stroke={ring} strokeOpacity="0.5" />
              <circle cx={p.x} cy={p.y} r={p.r} fill={fill} stroke={ring} strokeWidth="1.5" filter="url(#wt-b-shadow)" />
              <text x={lx} y={ly} textAnchor="middle" fontSize="13" fontWeight="700" fill={text}>{p.b.name}</text>
              <text x={lx} y={ly + 15} textAnchor="middle" fontSize="12" fontWeight="600" fill={text} fillOpacity="0.85">{pct(p.b.share)}</text>
            </g>
          );
        })}
      </svg>

      {/* Phones: the same data as a list, closest first. */}
      <ol className="wt-glass-list wt-nums">
        {bubbles.map((b) => {
          const { text } = paint(b.share);
          return (
            <li key={b.name}>
              <span style={{ color: text }}>{b.name}</span>
              <i><b style={{ width: `${Math.min(b.share, 1) * 100}%`, background: text }} /></i>
              <em>{pct(b.share)}</em>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
