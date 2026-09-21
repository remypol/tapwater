"use client";

import { useEffect, useRef } from "react";

interface TankCanvasProps {
  /** How full the tank is, 0–1: the district's score out of 10. */
  level: number;
  /** mg/L as CaCO3, or null when unknown. Drives how many mineral specks drift in the water. */
  hardness: number | null;
}

interface Speck {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

/**
 * The water in the tank. Three layered swells for the surface, and a drift of pale
 * specks whose number follows the hardness reading, so a soft district is visibly
 * clear and a hard one visibly mineral. Specks stay out of the left-hand text column
 * on wide screens and are fainter on phones, where text and water share the space.
 *
 * Still frame under prefers-reduced-motion. The CSS behind the canvas paints the same
 * water level, so nothing jumps when this mounts.
 */
export function TankCanvas({ level, hardness }: TankCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let specks: Speck[] = [];
    let frame = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = hardness == null ? 0 : Math.round((Math.min(hardness, 400) / 400) * Math.min(220, width / 5));
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random(),
        r: 0.7 + Math.random() * 2.1,
        speed: 0.15 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const swell = (x: number, t: number, k: number) =>
      Math.sin(x * 0.012 + t * 1.1 + k) * 7 + Math.sin(x * 0.027 - t * 0.8 + k * 2) * 4;

    const draw = (ms: number) => {
      const t = ms / 1000;
      const top = height * (1 - level);
      const wide = width > 820;
      ctx.clearRect(0, 0, width, height);

      const tones = ["#4f9bff", "#1f78ff", "#0a5cf5"];
      const alphas = [0.55, 0.8, 1];
      for (let layer = 0; layer < 3; layer++) {
        const fill = ctx.createLinearGradient(0, top, 0, height);
        fill.addColorStop(0, tones[layer]);
        fill.addColorStop(0.55, "#0839b8");
        fill.addColorStop(1, "#06257a");
        ctx.fillStyle = fill;
        ctx.globalAlpha = alphas[layer];
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 8) ctx.lineTo(x, top + layer * 9 + swell(x, t, layer * 1.7));
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const glow = ctx.createRadialGradient(width * 0.74, top + 40, 10, width * 0.74, top + 40, height * 0.7);
      glow.addColorStop(0, "rgba(255,255,255,0.2)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, top, width, height - top);

      for (const s of specks) {
        const x = s.x + Math.sin(t * s.speed + s.phase) * 10;
        const y = top + 28 + s.y * (height - top - 36);
        if (!reduce) {
          s.y += s.speed * 0.00035;
          if (s.y > 1) s.y = 0;
        }
        // Keep the headline readable: fade specks out across the text column.
        const clear = wide ? Math.min(1, Math.max(0, (x / width - 0.5) / 0.18)) : 0.35;
        if (clear <= 0.02) continue;
        ctx.fillStyle = `rgba(243,239,230,${(0.3 + s.r / 7) * clear})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce && visible) frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      if (reduce) draw(0);
    };
    window.addEventListener("resize", onResize);

    // No point animating water nobody can see.
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduce) frame = requestAnimationFrame(draw);
    });
    io.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, [level, hardness]);

  return <canvas ref={ref} aria-hidden="true" />;
}
