import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { PACK_LEADS, PACK_PRICE_GBP, PRICE_PER_LEAD_GBP, formatGbp } from "@/lib/partner-offer";
import { stripeConfigured } from "@/lib/stripe-lite";
import { supabase } from "@/lib/supabase";
import "@/components/tank/tank.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your installer account",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ p?: string; t?: string; paid?: string; error?: string }>;
}

interface Account {
  id: string;
  company_name: string;
  status: string;
  lead_credits: number;
  coverage_areas: string[] | null;
  access_token: string | null;
}

async function loadAccount(id: string, token: string): Promise<{ account: Account; received: number; waiting: number } | null> {
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id) || token.length < 16) return null;
  const { data } = await supabase
    .from("installer_partners")
    .select("id, company_name, status, lead_credits, coverage_areas, access_token")
    .eq("id", id)
    .maybeSingle();
  const account = data as Account | null;
  if (!account?.access_token) return null;
  const a = Buffer.from(account.access_token);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const { data: rows } = await supabase.from("lead_deliveries").select("status").eq("partner_id", id);
  const deliveries = (rows ?? []) as { status: string }[];
  return {
    account,
    received: deliveries.filter((d) => d.status === "sent").length,
    waiting: deliveries.filter((d) => d.status === "withheld").length,
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wt">
      <section className="wt-chalk" style={{ minHeight: "70vh" }}>
        <div className="wt-inner">{children}</div>
      </section>
    </div>
  );
}

export default async function TopUpPage({ searchParams }: Props) {
  const { p = "", t = "", paid, error } = await searchParams;
  const found = await loadAccount(p, t);

  if (!found) {
    return (
      <Shell>
        <h1 className="wt-h2">This link is not valid</h1>
        <p>
          Open the link from your newest TapWater.uk email, or write to <a className="wt-link" href="mailto:partners@tapwater.uk">partners@tapwater.uk</a>.
        </p>
      </Shell>
    );
  }

  const { account, received, waiting } = found;
  const areas = (account.coverage_areas ?? []).join(", ");

  if (account.status !== "active") {
    return (
      <Shell>
        <h1 className="wt-h2">{account.company_name} is being checked</h1>
        <p>We confirm every installer before sharing homeowners&rsquo; details, usually within one working day. You will get an email when your account is live.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="wt-chalk-grid">
        <p className="wt-n wt-nums">
          {account.lead_credits}
          <small>
            lead{account.lead_credits === 1 ? "" : "s"} left on your account. {received} received so far.
          </small>
        </p>
        <div>
          <h1 className="wt-h2">{account.company_name}</h1>
          <p>
            You receive softener quote requests from <strong>{areas}</strong>.
          </p>
          {paid ? (
            <p role="status">
              <strong>Payment received.</strong> Your leads are added within a minute, and any request that was waiting for you is on its way by email.
            </p>
          ) : null}
          {error ? (
            <p role="alert">
              <strong>The payment page did not open.</strong> Nothing was charged. Try again, or write to{" "}
              <a className="wt-link" href="mailto:partners@tapwater.uk">partners@tapwater.uk</a>.
            </p>
          ) : null}
          {waiting > 0 && account.lead_credits === 0 ? (
            <p>
              <strong>
                {waiting} request{waiting === 1 ? " is" : "s are"} waiting for you.
              </strong>{" "}
              Recent ones are sent as soon as you top up.
            </p>
          ) : null}
          <p>
            {PACK_LEADS} more leads cost {formatGbp(PACK_PRICE_GBP)}, which is {formatGbp(PRICE_PER_LEAD_GBP)} each. They stay on your account until they are used.
          </p>
          {stripeConfigured() ? (
            <form method="post" action="/api/partners/checkout" style={{ marginTop: 28 }}>
              <input type="hidden" name="p" value={account.id} />
              <input type="hidden" name="t" value={t} />
              <button type="submit" className="wt-btn wt-btn--ink">
                Add {PACK_LEADS} leads for {formatGbp(PACK_PRICE_GBP)}
              </button>
            </form>
          ) : (
            <p>
              To add leads, email{" "}
              <a className="wt-link" href={`mailto:partners@tapwater.uk?subject=${encodeURIComponent(`Add ${PACK_LEADS} leads: ${account.company_name}`)}`}>
                partners@tapwater.uk
              </a>{" "}
              and we will send a payment link the same day.
            </p>
          )}
          <p style={{ marginTop: 28 }}>
            <Link href="/partners" className="wt-link">How the installer programme works</Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
