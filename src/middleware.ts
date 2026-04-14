import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect full postcodes (e.g. /postcode/SW1A1AA) to their district
 * (e.g. /postcode/SW1A). This captures link equity from external links
 * using full postcodes and avoids 404s that waste crawl budget.
 *
 * UK postcode format: 1-2 letters + 1-2 digits + optional digit/letter = outward code,
 * followed by digit + 2 letters = inward code.
 */

const FULL_POSTCODE_RE =
  /^\/postcode\/([A-Z]{1,2}\d[A-Z\d]?)\d[A-Z]{2}$/i;

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(FULL_POSTCODE_RE);
  if (match) {
    const district = match[1].toUpperCase();
    const url = request.nextUrl.clone();
    url.pathname = `/postcode/${district}`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/postcode/:path*",
};
