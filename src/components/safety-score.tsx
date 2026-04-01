'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

interface Props {
  score: number
  size?: number
  parameterCount?: number
}

function getColor(score: number): string {
  if (score >= 7) return '#16a34a'
  if (score >= 4) return '#d97706'
  return '#dc2626'
}

function getGrade(score: number): { label: string; badgeClass: string } {
  if (score >= 9) return { label: 'Excellent', badgeClass: 'badge-safe' }
  if (score >= 7) return { label: 'Good', badgeClass: 'badge-safe' }
  if (score >= 5) return { label: 'Fair', badgeClass: 'badge-warning' }
  if (score >= 3) return { label: 'Poor', badgeClass: 'badge-danger' }
  return { label: 'Very Poor', badgeClass: 'badge-danger' }
}

function GradeIcon({ score, size }: { score: number; size: number }) {
  const iconSize = Math.round(size * 0.075)
  if (score >= 7) return <ShieldCheck width={iconSize} height={iconSize} />
  if (score >= 4) return <ShieldAlert width={iconSize} height={iconSize} />
  return <ShieldX width={iconSize} height={iconSize} />
}

export function SafetyScore({ score, size = 200, parameterCount = 12 }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const rafRef = useRef<number | null>(null)

  const strokeWidth = size * 0.05
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 10) * circumference

  const color = getColor(score)
  const { label, badgeClass } = getGrade(score)

  useEffect(() => {
    const duration = 1000
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
  }, [score])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring + center number */}
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Water quality score: ${score} out of 10, rated ${label}. Based on ${parameterCount} regulated parameters.`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className="animate-ring"
            style={
              {
                '--circumference': circumference,
                '--dash-offset': dashOffset,
              } as React.CSSProperties
            }
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-data font-bold leading-none tabular-nums"
            style={{ fontSize: size * 0.28, color }}
            aria-hidden="true"
          >
            {displayScore.toFixed(1)}
          </span>
          <span
            className="font-data text-faint leading-none"
            style={{ fontSize: size * 0.1 }}
            aria-hidden="true"
          >
            /10
          </span>
        </div>
      </div>

      {/* Grade badge */}
      <span className={`badge ${badgeClass} animate-fade-up delay-6`}>
        <GradeIcon score={score} size={size} />
        {label}
      </span>

      {/* Parameter summary */}
      <p className="text-sm text-muted animate-fade-in delay-7">
        Based on {parameterCount} regulated parameters
      </p>
    </div>
  )
}
