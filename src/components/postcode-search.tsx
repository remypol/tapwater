'use client'

import { Search, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  size?: "lg" | "sm"
}

const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/

function extractDistrict(input: string): string | null {
  const normalized = input.trim().toUpperCase()
  const parts = normalized.split(/\s+/)
  const district = parts.length > 1 ? parts[0] : normalized.replace(/[^A-Z0-9]/g, "").slice(0, 4)
  return DISTRICT_RE.test(district) ? district : null
}

export function PostcodeSearch({ size = "lg" }: Props) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const [focused, setFocused] = useState(false)

  const isLg = size === "lg"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const district = extractDistrict(value)
    if (!district) {
      setError("Please enter a valid postcode or district — e.g. SW1A 1AA, M1, B1")
      return
    }

    router.push(`/postcode/${district}/`)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate>
        {isLg ? (
          <div className="card-elevated rounded-2xl p-1.5">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint pointer-events-none" />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter your postcode..."
                  aria-label="Postcode"
                  className={[
                    "w-full text-lg py-4 pl-12 pr-4 bg-transparent text-ink focus:outline-none",
                    "transition-opacity duration-300",
                    focused ? "placeholder:opacity-40" : "placeholder:text-faint",
                  ].join(" ")}
                />
                {/* Wave focus bar */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] bg-[#0891b2] transition-all duration-300 ease-out"
                  style={{ width: focused ? "100%" : "0%" }}
                />
              </div>
              <button
                type="submit"
                className="bg-ink text-white rounded-xl py-4 px-7 text-base font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors shrink-0"
              >
                Check
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="card rounded-xl p-1">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter your postcode..."
                  aria-label="Postcode"
                  className="w-full text-sm py-2.5 pl-9 pr-3 bg-transparent text-ink focus:outline-none placeholder:text-faint"
                />
              </div>
              <button
                type="submit"
                className="bg-ink text-white rounded-lg py-2.5 px-4 text-sm font-medium flex items-center hover:bg-gray-800 transition-colors shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </form>

      {isLg && !error && (
        <p className="text-xs text-faint mt-3 text-center">
          Try your postcode — e.g. SW1A, M1, B1
        </p>
      )}
    </div>
  )
}
