import type { SubscriberSequenceState, EmailSequenceStep } from "./types";
import { recommendFilters } from "./filters";

const SEQUENCE_STEPS: EmailSequenceStep[] = [0, 3, 7, 14, 30];

const STEP_DELAYS: Record<EmailSequenceStep, number> = {
  0: 0,
  3: 3,
  7: 4,
  14: 7,
  30: 16,
};

const BASE_URL = "https://tapwater.uk";
const ACCENT = "#0891b2";

interface SequenceEmail {
  step: EmailSequenceStep;
  subject: string;
}

function getSubject(sub: SubscriberSequenceState, step: EmailSequenceStep): string {
  const pc = sub.postcodeDistrict;
  switch (step) {
    case 0:
      return `Your water in ${pc} — here's what we found`;
    case 3: {
      const top = sub.waterDataSnapshot.topConcerns[0];
      return top
        ? `What ${top} in your water means for you — ${pc}`
        : `Good news about your water in ${pc}`;
    }
    case 7:
      return `What you can do about your water in ${pc}`;
    case 14:
      return `Test your water at home — ${pc}`;
    case 30:
      return `Water quality update for ${pc}`;
  }
}

export function getNextEmail(
  sub: SubscriberSequenceState,
): SequenceEmail | null {
  const currentIndex =
    sub.lastEmailSent === null ? -1 : SEQUENCE_STEPS.indexOf(sub.lastEmailSent);
  const nextIndex = currentIndex + 1;
  if (nextIndex >= SEQUENCE_STEPS.length) return null;
  const step = SEQUENCE_STEPS[nextIndex];
  return { step, subject: getSubject(sub, step) };
}

export function shouldSendEmail(
  sub: SubscriberSequenceState,
  step: EmailSequenceStep,
  now: Date,
): boolean {
  if (step === 0) return true;

  if (!sub.lastEmailSentAt) return false;

  const lastSent = new Date(sub.lastEmailSentAt);
  const delayDays = STEP_DELAYS[step];
  const delayMs = delayDays * 24 * 60 * 60 * 1000;
  return now.getTime() - lastSent.getTime() >= delayMs;
}

function emailWrapper(innerHtml: string, sub: SubscriberSequenceState): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${ACCENT};padding:24px 32px;">
  <a href="${BASE_URL}" style="color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;letter-spacing:-0.5px;">TapWater.uk</a>
</td></tr>
<tr><td style="padding:32px;">
${innerHtml}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;color:#71717a;font-size:13px;line-height:1.5;">
  <p style="margin:0 0 8px;">You received this because you signed up for water quality alerts for ${sub.postcodeDistrict}.</p>
  <p style="margin:0;"><a href="${BASE_URL}/unsubscribe?email=${encodeURIComponent(sub.email)}" style="color:${ACCENT};">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#27272a;">${text}</p>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b;">${text}</h2>`;
}

function cta(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:${ACCENT};color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a></p>`;
}

function buildDay0(sub: SubscriberSequenceState): string {
  const { safetyScore, scoreGrade, contaminantsFlagged, topConcerns, pfasDetected } =
    sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;

  let inner = heading(`Your water quality report for ${pc}`);
  inner += p(
    `We analysed the latest data for your area. Your water scored <strong>${safetyScore} out of 10</strong> — rated <strong>${scoreGrade}</strong>.`,
  );

  if (contaminantsFlagged > 0) {
    inner += p(
      `We flagged <strong>${contaminantsFlagged} contaminant${contaminantsFlagged > 1 ? "s" : ""}</strong> that may be worth looking into: ${topConcerns.join(", ")}.`,
    );
  } else {
    inner += p("No contaminants were flagged above concerning levels. That's good news.");
  }

  if (pfasDetected) {
    inner += p(
      '<strong>PFAS detected.</strong> These "forever chemicals" don\'t break down and can build up over time. We\'ll share more on what you can do in the next few days.',
    );
  }

  inner += p(
    "The national average score is around 7.0. " +
      (safetyScore >= 7
        ? "Your area is performing well."
        : "Your area has room for improvement."),
  );

  inner += cta(`${BASE_URL}/postcode/${pc}/`, "View your full report");
  return emailWrapper(inner, sub);
}

function buildDay3(sub: SubscriberSequenceState): string {
  const { topConcerns } = sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;

  let inner = "";

  if (topConcerns.length > 0) {
    const concern = topConcerns[0];
    inner += heading(`What ${concern} in your water means`);
    inner += p(
      `${concern} was flagged in the water supply for ${pc}. Here's what you should know about why it matters and where it comes from.`,
    );
    inner += p(
      `${concern} can enter the water supply through ageing infrastructure, industrial processes, or natural sources. Even at low levels, long-term exposure is worth understanding.`,
    );
    inner += cta(
      `${BASE_URL}/contaminants/${encodeURIComponent(concern.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""))}/`,
      `Learn more about ${concern}`,
    );

    if (topConcerns.length > 1) {
      inner += p(
        `We also flagged: ${topConcerns.slice(1).join(", ")}. You can read about each on your full report.`,
      );
    }
  } else {
    inner += heading(`Good news about your water in ${pc}`);
    inner += p(
      "We didn't flag any contaminants at concerning levels in your area. Your water supply is looking good based on the latest available data.",
    );
    inner += p(
      "We'll keep monitoring and let you know if anything changes. In the meantime, you can always check your full report.",
    );
  }

  inner += cta(`${BASE_URL}/postcode/${pc}/`, "View your full report");
  return emailWrapper(inner, sub);
}

function buildDay7(sub: SubscriberSequenceState): string {
  const { topConcerns } = sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;
  const filters = recommendFilters(topConcerns, 3);

  let inner = heading(`What you can do about your water in ${pc}`);
  inner += p(
    "Based on the contaminants we found in your area, here are the filters that would make the biggest difference.",
  );

  for (const filter of filters) {
    inner += `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
<tr>
<td style="padding:16px;">
  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#18181b;">${filter.brand} ${filter.model}</p>
  <p style="margin:0 0 8px;font-size:14px;color:#71717a;">${filter.bestFor} &middot; From &pound;${filter.priceGbp}</p>
  <a href="${filter.affiliateUrl}" style="color:${ACCENT};font-size:14px;font-weight:600;text-decoration:none;">View on Amazon &rarr;</a>
</td>
</tr>
</table>`;
  }

  inner += p(
    '<span style="font-size:13px;color:#a1a1aa;">These are affiliate links. If you buy through them, we earn a small commission at no extra cost to you.</span>',
  );

  inner += cta(`${BASE_URL}/filters/`, "See all recommended filters");
  return emailWrapper(inner, sub);
}

function buildDay14(sub: SubscriberSequenceState): string {
  const pc = sub.postcodeDistrict;

  let inner = heading("Want to know exactly what's in your water?");
  inner += p(
    `Our data for ${pc} comes from your water company's published results. But every home is different — older pipes, local plumbing, and other factors can affect what comes out of your tap.`,
  );
  inner += p(
    "A home testing kit gives you a clear picture of your actual water quality. It takes a few minutes, and results come back within days.",
  );
  inner += cta(`${BASE_URL}/filters/testing-kits/`, "Browse testing kits");
  inner += p(
    "Even if your area scores well, testing is the only way to know for sure what you're drinking.",
  );
  return emailWrapper(inner, sub);
}

function buildDay30(sub: SubscriberSequenceState): string {
  const pc = sub.postcodeDistrict;
  const { safetyScore, scoreGrade } = sub.waterDataSnapshot;

  let inner = heading(`Water quality update for ${pc}`);
  inner += p(
    `It's been a month since you first checked your water quality. Your area currently scores <strong>${safetyScore} out of 10</strong> (${scoreGrade}).`,
  );
  inner += p(
    "Water quality data is updated regularly as new testing results come in. Check your report for the latest numbers.",
  );
  inner += cta(`${BASE_URL}/postcode/${pc}/`, `See latest results for ${pc}`);
  inner += p(
    "Thanks for using TapWater.uk. If you found this useful, share it with someone who might want to check their water too.",
  );
  return emailWrapper(inner, sub);
}

export function buildEmailHtml(
  sub: SubscriberSequenceState,
  step: EmailSequenceStep,
): string {
  switch (step) {
    case 0:
      return buildDay0(sub);
    case 3:
      return buildDay3(sub);
    case 7:
      return buildDay7(sub);
    case 14:
      return buildDay14(sub);
    case 30:
      return buildDay30(sub);
  }
}
