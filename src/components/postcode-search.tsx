'use client'

import { Search, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { events } from "@/lib/analytics"
import { useState } from "react"

type Props = {
  size?: "lg" | "sm"
  /** Section of the postcode page to land on, e.g. "river-health". */
  hash?: string
}

const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/

function extractDistrict(input: string): string | null {
  const normalized = input.trim().toUpperCase()
  const parts = normalized.split(/\s+/)
  const district = parts.length > 1 ? parts[0] : normalized.replace(/[^A-Z0-9]/g, "").slice(0, 4)
  return DISTRICT_RE.test(district) ? district : null
}

export function PostcodeSearch({ size = "lg", hash }: Props) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  const isLg = size === "lg"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const district = extractDistrict(value)
    if (!district) {
      setError("Please enter a valid postcode or district — e.g. SW1A 1AA, M1, B1")
      return
    }

    events.postcodeSearch(district)
    router.push(`/postcode/${district}/${hash ? `#${hash}` : ""}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`wt-search${isLg ? "" : " wt-search--sm"}`} role="search">
      <div className="wt-search-row">
        <Search aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your postcode"
          aria-label="Postcode"
          autoCapitalize="characters"
          autoComplete="postal-code"
          spellCheck={false}
        />
        <button type="submit" className="wt-btn wt-btn--sun">
          {isLg ? "Check my water" : "Check"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      {error ? <p className="wt-search-error" role="alert">{error}</p> : null}
    </form>
  )
}
