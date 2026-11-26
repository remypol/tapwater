import { NextResponse } from "next/server";

/**
 * Took softener quote requests until 26 November 2026. No installer or lead
 * buyer took them on, so the site stopped asking; the form is gone and this
 * endpoint only answers a page that was still open in someone's browser. The
 * old handler (store, forward to installers, confirmation email) is in git
 * history at 4c52d79.
 */
export function POST() {
  return NextResponse.json(
    { error: "We no longer arrange softener quotes. Ask installers directly; our cost guide at tapwater.uk/guides/water-softener-cost-uk lists what each brand charges." },
    { status: 410 },
  );
}
