'use client'

import { useEffect, useRef, useState } from 'react'
import { getScoreColor, getScoreGrade } from '@/lib/types'

interface Props {
  score: number
  size?: number
  tested?: number
  flagged?: number
}

// Gradient colours per level
const GRADIENTS = {
  safe:    { from: '#0891b2', to: '#06b6d4' },
  warning: { from: '#d97706', to: '#f59e0b' },
  danger:  { from: '#dc2626', to: '#f87171' },
}

// Badge colours per level
const BADGE_STYLES = {
  safe:    { background: 'var(--color-safe-light)',    color: 'var(--color-safe)'    },
  warning: { background: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  danger:  { background: 'var(--color-danger-light)',  color: 'var(--color-danger)'  },
}

function getPrimaryLine(score: number): string {
  if (score >= 7) return 'Your water is safe'
  if (score >= 5) return 'Your water is mostly fine'
  if (score >= 3) return 'Your water has some issues'
  return 'Your water needs attention'
}

function getSecondaryLine(tested?: number, flagged?: number, score?: number): string | null {
  if (tested === undefined) return null
  let secondary: string
  if (!flagged || flagged === 0) {
    secondary = 'nothing to worry about'
  } else if (score !== undefined && score >= 5) {
    secondary = `${flagged} worth knowing about`
  } else {
    secondary = `${flagged} above recommended safe levels`
  }
  return `We checked ${tested} things and found ${secondary}`
}

export function WaterDropScore({ score, size = 200, tested, flagged }: Props) {
  const level = getScoreColor(score)
  const grade = getScoreGrade(score)
  const gradient = GRADIENTS[level]
  const badgeStyle = BADGE_STYLES[level]

  const w = size
  const h = size * 1.3

  // SVG drop path using bezier teardrop
  const dropPath = `M${w / 2} 0 C${w * 0.15} ${h * 0.35} 0 ${h * 0.55} 0 ${h * 0.7} C0 ${h * 0.88} ${w * 0.22} ${h} ${w / 2} ${h} C${w * 0.78} ${h} ${w} ${h * 0.88} ${w} ${h * 0.7} C${w} ${h * 0.55} ${w * 0.85} ${h * 0.35} ${w / 2} 0 Z`

  // Fill percentage: 0 (empty) → 1 (full). score 0=empty, 10=full.
  const fillPercent = Math.max(0, Math.min(1, score / 10))

  // The water rect fills from y=(h - fillPercent*h) to h
  const waterHeight = fillPercent * h
  const waterY = h - waterHeight

  // Count-up animation state
  const [displayScore, setDisplayScore] = useState(0)
  const rafRef = useRef<number | null>(null)

  // Reduced motion detection
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Count-up number
  useEffect(() => {
    if (reducedMotion) {
      setDisplayScore(score)
      return
    }

    const duration = 1200
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(parseFloat((eased * score).toFixed(1)))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayScore(score)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [score, reducedMotion])

  // Water rise animation: CSS custom property --water-offset drives translateY
  // We animate from translateY(waterHeight) → translateY(0) over 1.2s
  const waterRiseStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        animation: `water-rise-drop 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        transform: `translateY(${waterHeight}px)`,
      }

  // Wave surface y position (relative to SVG, top of the water rect)
  const waveY = waterY
  // Ellipse rx/ry for wave shape
  const waveRx = w * 0.55
  const waveRy = h * 0.025

  // Score text colour: white when water covers it (fillPercent > 55%), dark otherwise
  const scoreCenterY = h * 0.65
  const textColor = fillPercent > 0.55 ? '#ffffff' : 'var(--color-ink)'

  const fontSize = size * 0.22
  const subFontSize = size * 0.09
  const primaryLineSize = size * 0.09

  const gradientId = `drop-gradient-${level}`
  const clipId = `drop-clip`
  const waveAnimId = `wave-anim`
  const wave2AnimId = `wave2-anim`

  const primaryLine = getPrimaryLine(score)
  const secondaryLine = getSecondaryLine(tested, flagged, score)

  const ariaLabel = `Water quality score: ${score} out of 10, rated ${grade}. ${primaryLine}.${secondaryLine ? ` ${secondaryLine}.` : ''}`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Keyframe injection */}
      <style>{`
        @keyframes water-rise-drop {
          from { transform: translateY(${waterHeight}px); }
          to   { transform: translateY(0); }
        }
        @keyframes wave {
          0%   { transform: translateX(0)        scaleY(1); }
          50%  { transform: translateX(-${w * 0.06}px) scaleY(0.7); }
          100% { transform: translateX(0)        scaleY(1); }
        }
        @keyframes wave2 {
          0%   { transform: translateX(0)       scaleY(0.8); }
          50%  { transform: translateX(${w * 0.06}px) scaleY(1.2); }
          100% { transform: translateX(0)       scaleY(0.8); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wave-ellipse-1, .wave-ellipse-2 { animation: none !important; }
        }
      `}</style>

      {/* Drop SVG */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={ariaLabel}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradient */}
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>

          {/* Clip path matching drop shape */}
          <clipPath id={clipId}>
            <path d={dropPath} />
          </clipPath>
        </defs>

        {/* Drop outline */}
        <path
          d={dropPath}
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth={1.5}
        />

        {/* Water fill group — animates upward on mount */}
        <g clipPath={`url(#${clipId})`}>
          <g style={waterRiseStyle}>
            {/* Water colour rect */}
            <rect
              x={0}
              y={waterY}
              width={w}
              height={waterHeight}
              fill={`url(#${gradientId})`}
            />

            {/* Wave ellipse 1 */}
            <ellipse
              className="wave-ellipse-1"
              cx={w / 2}
              cy={waveY}
              rx={waveRx}
              ry={waveRy}
              fill={gradient.to}
              style={
                reducedMotion
                  ? {}
                  : {
                      animation: `wave 2.4s ease-in-out infinite`,
                      transformOrigin: `${w / 2}px ${waveY}px`,
                    }
              }
            />

            {/* Wave ellipse 2 (offset phase) */}
            <ellipse
              className="wave-ellipse-2"
              cx={w / 2}
              cy={waveY}
              rx={waveRx * 0.9}
              ry={waveRy * 0.8}
              fill={gradient.from}
              opacity={0.6}
              style={
                reducedMotion
                  ? {}
                  : {
                      animation: `wave2 2s ease-in-out infinite`,
                      animationDelay: '0.4s',
                      transformOrigin: `${w / 2}px ${waveY}px`,
                    }
              }
            />
          </g>
        </g>

        {/* Score number — centred vertically in the bulge area */}
        <text
          x={w / 2}
          y={scoreCenterY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-data"
          fontWeight="bold"
          fontSize={fontSize}
          fill={textColor}
          style={{ fontFamily: 'var(--font-space-mono), monospace', letterSpacing: '-0.02em' }}
          aria-hidden="true"
        >
          {displayScore.toFixed(1)}
        </text>

        {/* /10 sub-label */}
        <text
          x={w / 2}
          y={scoreCenterY + fontSize * 0.6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={subFontSize}
          fill="var(--color-muted)"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          aria-hidden="true"
        >
          /10
        </text>
      </svg>

      {/* Primary line */}
      <p
        className="font-sans font-semibold text-center animate-fade-up delay-3"
        style={{
          fontSize: primaryLineSize,
          color:
            level === 'safe'
              ? 'var(--color-safe)'
              : level === 'warning'
              ? 'var(--color-warning)'
              : 'var(--color-danger)',
        }}
      >
        {primaryLine}
      </p>

      {/* Secondary line */}
      {secondaryLine && (
        <p className="text-sm text-center animate-fade-in delay-4" style={{ color: 'var(--color-muted)' }}>
          {secondaryLine}
        </p>
      )}

      {/* Grade badge */}
      <span
        className="badge animate-fade-up delay-5"
        style={badgeStyle}
      >
        {grade}
      </span>
    </div>
  )
}
