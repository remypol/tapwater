import { redirect } from "next/navigation";

/**
 * This page sold softener leads to installers (first leads free, then a price
 * per lead). Since 26 November 2026 the site no longer collects quote requests,
 * so there is nothing to sell: none of the 14 installers we wrote to signed up
 * and Softwater Solutions declined. The old page is in git history (4c52d79).
 * A temporary redirect, not a permanent one, in case a lead buyer turns up.
 */
export default function PartnersPage() {
  redirect("/");
}
