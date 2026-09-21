"use client";

import { useState } from "react";
import type { Bubble } from "@/lib/tank-plan";
import { formatReading } from "@/lib/tank-plan";

const COLUMN_HEIGHT = 440;
const LIMIT_Y = 64; // px from the top: where a result at 100% of its limit floats
const FLOOR_Y = 420;

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

function describe(b: Bubble): string {
  const pct = Math.round(b.share * 100);
  const share = pct < 1 ? "under 1%" : `${pct}%`;
  const verdict = b.share > 1 ? "Over the legal limit." : b.share >= 0.75 ? "Legal, but close to the limit." : "Well inside the limit.";
  return `${formatReading(b.value)} ${b.unit}, which is ${share} of the ${formatReading(b.limit)} ${b.unit} legal limit. ${verdict}`;
}

/**
 * Every tested substance as a bubble. Height is the share of the legal limit it uses,
 * so the one thing worth noticing is literally the one nearest the top. Tap a bubble
 * for its numbers; the full table sits underneath for anyone who wants rows.
 */
export function BubbleColumn({ bubbles }: { bubbles: Bubble[] }) {
  const [active, setActive] = useState(0);
  if (bubbles.length === 0) return null;
  const slots = slotOrder(bubbles.length);
  const current = bubbles[active] ?? bubbles[0];

  return (
    <>
      <div className="wt-colwrap">
        <div className="wt-col" style={{ height: COLUMN_HEIGHT }}>
          <div className="wt-limit"><span>Legal limit</span></div>
          <div className="wt-half" style={{ top: LIMIT_Y + (FLOOR_Y - LIMIT_Y) / 2 }}><span>Half of the limit</span></div>
          {bubbles.map((b, i) => {
            const share = Math.min(b.share, 1.12);
            const size = Math.round(34 + Math.min(b.share, 1) * 62);
            const tone = b.share > 1 ? " wt-b--over" : b.share >= 0.75 ? " wt-b--hot" : "";
            const pct = Math.round(b.share * 100);
            return (
              <button
                key={b.name}
                type="button"
                className={`wt-b${tone}`}
                aria-pressed={i === active}
                aria-label={`${b.name}: ${pct}% of the legal limit`}
                onClick={() => setActive(i)}
                style={{
                  width: size,
                  height: size,
                  left: `${((slots[i] + 0.8) / (bubbles.length + 0.6)) * 100}%`,
                  bottom: COLUMN_HEIGHT - FLOOR_Y + share * (FLOOR_Y - LIMIT_Y),
                  animationDelay: `${-i * 0.37}s`,
                }}
              >
                <em>{size >= 58 ? <>{b.name}<br />{pct}%</> : null}</em>
              </button>
            );
          })}
        </div>
      </div>
      <p className="wt-readout wt-nums" aria-live="polite">
        <strong>{current.name}</strong>
        <span>{describe(current)}</span>
      </p>
    </>
  );
}
