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

const BASE_URL = "https://www.tapwater.uk";

interface SequenceEmail {
  step: EmailSequenceStep;
  subject: string;
  html: string;
}

/* ── Design tokens ─────────────────────────────────────────────── */

const COLORS = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  accent: "#0891b2",
  accentDark: "#0e7490",
  white: "#ffffff",
  text: "#27272a",
  textLight: "#64748b",
  textMuted: "#94a3b8",
  safe: "#22c55e",
  warning: "#f59e0b",
  danger: "#f87171",
  dangerDark: "#dc2626",
};

/* ── Contaminant explainers ────────────────────────────────────── */

const CONTAMINANT_EXPLAINERS: Record<string, { source: string; risk: string; fix: string; stat: string; statLabel: string }> = {
  Lead: {
    source: "Lead in tap water almost always comes from the pipes in your building — not the water supply itself. Homes built before 1970 are most at risk.",
    risk: "Low-level lead exposure builds up over time. Young children and pregnant women are most vulnerable. The UK limit is 10 \u00b5g/l, but the WHO says there\u2019s no truly safe level.",
    fix: "The most reliable fix is a water filter certified for lead removal (NSF/ANSI 53). Running the tap for 30 seconds before drinking also helps flush standing water from lead pipes.",
    stat: "40%",
    statLabel: "of UK homes still have some lead piping. Your water company may replace their side for free \u2014 ask them.",
  },
  "PFAS (total)": {
    source: "PFAS are synthetic chemicals used in non-stick coatings, waterproofing, and firefighting foam. They\u2019ve entered water supplies through industrial discharge and contaminated land.",
    risk: "Called \u2018forever chemicals\u2019 because they don\u2019t break down in the environment or your body. Research links long-term exposure to immune, thyroid, and liver effects.",
    fix: "Only reverse osmosis and activated carbon block filters reliably remove PFAS. Standard jug filters like BRITA do not remove them.",
    stat: "4,700+",
    statLabel: "individual PFAS compounds exist. The EU Drinking Water Directive now requires monitoring from January 2026.",
  },
  Nitrate: {
    source: "Nitrate enters water primarily through agricultural runoff \u2014 fertilisers and animal waste that seep into groundwater. Rural areas are most affected.",
    risk: "At high levels, nitrate can reduce the blood\u2019s ability to carry oxygen. Infants under 6 months are most at risk (blue baby syndrome). The UK limit is 50 mg/l.",
    fix: "Reverse osmosis is the most effective removal method. Ion exchange filters also work. Standard carbon filters do not remove nitrate.",
    stat: "50 mg/l",
    statLabel: "is the UK limit for nitrate. Agricultural areas often test close to this threshold.",
  },
  Chlorine: {
    source: "Chlorine is added deliberately by your water company to kill bacteria. It\u2019s not a contaminant \u2014 it\u2019s a disinfectant. But some people are sensitive to the taste and smell.",
    risk: "At UK levels, chlorine is safe to drink. Some research links chlorine byproducts (trihalomethanes) to health effects at very high exposure levels.",
    fix: "Almost any carbon-based filter removes chlorine effectively \u2014 even a basic jug filter. A shower filter removes it from bathing water.",
    stat: "99.9%",
    statLabel: "of harmful bacteria are killed by chlorination. It\u2019s the reason UK tap water is safe to drink.",
  },
  Fluoride: {
    source: "Some UK water companies add fluoride to prevent tooth decay. It also occurs naturally in some groundwater sources.",
    risk: "Below 1.5 mg/l, fluoride is considered safe and beneficial for dental health. Above this, dental fluorosis (white spots on teeth) can occur in children.",
    fix: "Only reverse osmosis and bone char filters remove fluoride. Standard carbon filters and most jug filters do not.",
    stat: "6m",
    statLabel: "people in the UK receive artificially fluoridated water. Whether it\u2019s in yours depends on your supplier.",
  },
  Copper: {
    source: "Copper enters tap water from copper pipes and fittings in your home\u2019s plumbing. New copper pipes can leach more than old ones.",
    risk: "At low levels, copper is an essential nutrient. Above the UK limit (2 mg/l), it can cause nausea and stomach issues. Long-term high exposure affects the liver.",
    fix: "Running the tap for 30 seconds before drinking flushes copper from standing water. Under-sink filters with KDF media are effective for ongoing removal.",
    stat: "2 mg/l",
    statLabel: "is the UK limit. Most UK water is well below this, but first-draw water from copper pipes can spike higher.",
  },
  Arsenic: {
    source: "Arsenic occurs naturally in some rock formations and can dissolve into groundwater. Some areas of the UK have naturally elevated levels.",
    risk: "Long-term exposure to arsenic above safe levels is linked to skin, bladder, and lung cancers. The UK limit is 10 \u00b5g/l, aligned with the WHO guideline.",
    fix: "Reverse osmosis is the most effective removal method. Some specialist adsorption media also work.",
    stat: "10 \u00b5g/l",
    statLabel: "is both the UK and WHO limit for arsenic in drinking water.",
  },
  Trihalomethanes: {
    source: "THMs form when chlorine reacts with organic matter in the water. Higher levels occur in areas with more organic material in the source water.",
    risk: "Long-term exposure above the UK limit (100 \u00b5g/l) may increase cancer risk. The levels found in UK tap water are generally considered low risk.",
    fix: "Activated carbon filters (including jug filters) reduce THMs. Reverse osmosis removes them almost completely.",
    stat: "100 \u00b5g/l",
    statLabel: "is the UK limit for total trihalomethanes. Most UK water tests well below this.",
  },
};

/* ── Subject lines ─────────────────────────────────────────────── */

function getSubject(sub: SubscriberSequenceState, step: EmailSequenceStep): string {
  const pc = sub.postcodeDistrict;
  const { safetyScore, contaminantsFlagged, topConcerns } = sub.waterDataSnapshot;

  switch (step) {
    case 0:
      return contaminantsFlagged > 0
        ? `${pc} scored ${safetyScore} \u2014 ${contaminantsFlagged} contaminant${contaminantsFlagged !== 1 ? "s" : ""} flagged in your water`
        : `${pc} scored ${safetyScore} \u2014 your water quality report`;
    case 3:
      return topConcerns.length > 0
        ? `${topConcerns[0]} was found in ${pc}'s water. Here's when it matters.`
        : `Good news about your water in ${pc} \u2014 and what to watch`;
    case 7:
      return contaminantsFlagged > 0
        ? `The ${Math.min(contaminantsFlagged, 3)} filter${contaminantsFlagged !== 1 ? "s" : ""} that fix what's in ${pc}'s water`
        : `The best water filters for ${pc} \u2014 even when your water's clean`;
    case 14:
      return `Is it your pipes or the water supply? One test tells you.`;
    case 30:
      return `Your water quality may have changed \u2014 updated report for ${pc}`;
  }
}

/* ── Reusable HTML helpers ─────────────────────────────────────── */

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${COLORS.textMuted};font-family:Georgia,'Times New Roman',serif;">${text}</p>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${COLORS.white};font-family:Georgia,'Times New Roman',serif;">${text}</h2>`;
}

function emailShell(innerHtml: string, sub: SubscriberSequenceState): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};overflow:hidden;">
${innerHtml}
<tr><td style="padding:32px 24px;border-top:1px solid ${COLORS.border};">
  <p style="margin:0 0 8px;font-size:12px;color:${COLORS.textLight};line-height:1.5;text-align:center;">You received this because you signed up for water quality alerts for ${sub.postcodeDistrict}.</p>
  <p style="margin:0;font-size:12px;text-align:center;"><a href="${BASE_URL}/unsubscribe?email=${encodeURIComponent(sub.email)}" style="color:${COLORS.textLight};text-decoration:underline;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function logoHeader(briefingLabel?: string): string {
  const labelHtml = briefingLabel
    ? `<p style="margin:8px 0 0;font-size:11px;color:${COLORS.textMuted};letter-spacing:2px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${briefingLabel}</p>`
    : "";
  return `<tr><td align="center" style="padding:40px 24px 24px;">
  <table cellpadding="0" cellspacing="0"><tr><td align="center">
    <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark});text-align:center;line-height:48px;font-size:22px;color:${COLORS.white};margin:0 auto;">
      <!--[if !mso]><!--><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${COLORS.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg><!--<![endif]-->
      <!--[if mso]>&bull;<![endif]-->
    </div>
    <p style="margin:12px 0 0;font-size:15px;font-weight:700;color:${COLORS.white};letter-spacing:3px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">TAPWATER.UK</p>
    ${labelHtml}
  </td></tr></table>
</td></tr>`;
}

function scoreColor(score: number): string {
  if (score >= 7) return COLORS.safe;
  if (score >= 4) return COLORS.warning;
  return COLORS.danger;
}

function gradeColor(grade: string): string {
  const g = grade.toLowerCase();
  if (g === "excellent" || g === "good") return COLORS.safe;
  if (g === "fair") return COLORS.warning;
  return COLORS.danger;
}

function scoreCentrepiece(score: number, grade: string, postcode: string, supplier?: string): string {
  const sc = scoreColor(score);
  const gc = gradeColor(grade);

  // 3-segment bar
  const segments = [
    { color: COLORS.danger, active: score < 4 },
    { color: COLORS.warning, active: score >= 4 && score < 7 },
    { color: COLORS.safe, active: score >= 7 },
  ];
  const barHtml = segments
    .map(
      (s) =>
        `<td style="width:33%;height:6px;background:${s.active ? s.color : COLORS.border};border-radius:3px;">&nbsp;</td>`,
    )
    .join('<td style="width:4px;">&nbsp;</td>');

  const supplierLine = supplier
    ? `<p style="margin:4px 0 0;font-size:13px;color:${COLORS.textLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Supplied by ${supplier}</p>`
    : "";

  return `<tr><td align="center" style="padding:0 24px 24px;">
  <table cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;width:100%;"><tr><td align="center" style="padding:32px 24px;">
    <p style="margin:0;font-size:48px;font-weight:700;color:${sc};font-family:Georgia,'Times New Roman',serif;line-height:1;">${score}</p>
    <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:${gc};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${grade}</p>
    <table cellpadding="0" cellspacing="0" style="width:200px;margin:16px auto 0;"><tr>${barHtml}</tr></table>
    <p style="margin:16px 0 0;font-size:13px;color:${COLORS.textMuted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${postcode} &middot; out of 10</p>
    ${supplierLine}
  </td></tr></table>
</td></tr>`;
}

function statPills(tested: number, flagged: number, pfasDetected: boolean): string {
  const pfasColor = pfasDetected ? COLORS.danger : COLORS.safe;
  const pfasText = pfasDetected ? "Yes" : "No";
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="33%" align="center" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:8px;padding:12px 8px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:${COLORS.white};font-family:Georgia,serif;">${tested}</p>
      <p style="margin:2px 0 0;font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;">Tested</p>
    </td>
    <td width="4">&nbsp;</td>
    <td width="33%" align="center" style="background:${COLORS.card};border:1px solid ${flagged > 0 ? COLORS.warning : COLORS.border};border-radius:8px;padding:12px 8px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:${flagged > 0 ? COLORS.warning : COLORS.white};font-family:Georgia,serif;">${flagged}</p>
      <p style="margin:2px 0 0;font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;">Flagged</p>
    </td>
    <td width="4">&nbsp;</td>
    <td width="33%" align="center" style="background:${COLORS.card};border:1px solid ${pfasDetected ? COLORS.danger : COLORS.border};border-radius:8px;padding:12px 8px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:${pfasColor};font-family:Georgia,serif;">${pfasText}</p>
      <p style="margin:2px 0 0;font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;">PFAS</p>
    </td>
  </tr></table>
</td></tr>`;
}

function contaminantRows(concerns: string[], statuses?: Record<string, string>): string {
  if (concerns.length === 0) return "";
  const rows = concerns
    .map((name) => {
      const status = statuses?.[name] ?? "Detected";
      const isAbove = status.toLowerCase().includes("above");
      const dotColor = isAbove ? COLORS.danger : COLORS.warning;
      const labelBg = isAbove ? COLORS.dangerDark : COLORS.warning;
      const labelColor = isAbove ? COLORS.white : COLORS.text;
      return `<tr>
  <td style="padding:10px 16px;border-bottom:1px solid ${COLORS.border};">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="12" valign="middle"><div style="width:8px;height:8px;border-radius:50%;background:${dotColor};"></div></td>
      <td style="padding-left:10px;font-size:15px;color:${COLORS.white};font-family:Georgia,serif;">${name}</td>
      <td align="right"><span style="display:inline-block;padding:3px 10px;border-radius:12px;background:${labelBg};color:${labelColor};font-size:11px;font-weight:600;font-family:-apple-system,sans-serif;">${status}</span></td>
    </tr></table>
  </td>
</tr>`;
    })
    .join("");
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;">
    <tr><td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};"><p style="margin:0;font-size:11px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;">Contaminants of note</p></td></tr>
    ${rows}
  </table>
</td></tr>`;
}

function topicHeader(title: string, subtitle: string, gradientFrom: string, gradientTo: string, labelColor: string): string {
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,${gradientFrom},${gradientTo});padding:28px 24px;">
      <p style="margin:0 0 6px;font-size:11px;color:${labelColor};text-transform:uppercase;letter-spacing:2px;font-weight:600;font-family:-apple-system,sans-serif;">${subtitle}</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${COLORS.white};font-family:Georgia,serif;line-height:1.2;">${title}</p>
    </td></tr>
  </table>
</td></tr>`;
}

function heroProductCard(product: { brand: string; model: string; category: string; certifications: string[]; priceGbp: number; rating: number; bestFor: string; removes: string[]; affiliateUrl: string; affiliateProgram: string }, postcode: string): string {
  const ctaLabel = product.affiliateProgram === "amazon" ? "View on Amazon" : `Check price on ${product.brand}`;
  const removePills = product.removes
    .slice(0, 4)
    .map((r) => `<span style="display:inline-block;padding:3px 10px;margin:0 4px 4px 0;border-radius:12px;background:#064e3b;color:${COLORS.safe};font-size:11px;font-weight:600;font-family:-apple-system,sans-serif;">${r}</span>`)
    .join("");
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
    <tr><td style="background:${COLORS.accentDark};padding:10px 16px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:${COLORS.white};font-family:-apple-system,sans-serif;">Our pick for ${postcode}</p>
    </td></tr>
    <tr><td style="background:${COLORS.card};padding:20px 16px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${COLORS.white};font-family:Georgia,serif;">${product.brand} ${product.model}</p>
      <p style="margin:0 0 12px;font-size:13px;color:${COLORS.textMuted};font-family:-apple-system,sans-serif;">${product.category} &middot; ${product.certifications.slice(0, 2).join(", ")}</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><p style="margin:0;font-size:22px;font-weight:700;color:${COLORS.white};font-family:Georgia,serif;">&pound;${product.priceGbp}</p></td>
        <td align="right"><p style="margin:0;font-size:14px;color:${COLORS.warning};font-family:-apple-system,sans-serif;">${"★".repeat(Math.round(product.rating))}${"☆".repeat(5 - Math.round(product.rating))} ${product.rating}</p></td>
      </tr></table>
      <p style="margin:12px 0;font-size:14px;color:${COLORS.textMuted};line-height:1.5;font-family:Georgia,serif;">${product.bestFor}</p>
      <p style="margin:0 0 16px;">${removePills}</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark});border-radius:10px;padding:14px;">
        <a href="${product.affiliateUrl}" style="color:${COLORS.white};font-size:15px;font-weight:700;text-decoration:none;font-family:-apple-system,sans-serif;">${ctaLabel}</a>
      </td></tr></table>
    </td></tr>
  </table>
</td></tr>`;
}

function budgetProductCard(product: { brand: string; model: string; priceGbp: number; affiliateUrl: string }): string {
  return `<tr><td style="padding:0 24px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0;font-size:15px;color:${COLORS.white};font-family:Georgia,serif;">${product.brand} ${product.model}</p>
        <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};font-family:-apple-system,sans-serif;">From &pound;${product.priceGbp}</p>
      </td>
      <td align="right" style="padding:14px 16px;">
        <a href="${product.affiliateUrl}" style="color:${COLORS.accent};font-size:13px;font-weight:600;text-decoration:none;font-family:-apple-system,sans-serif;">View &rarr;</a>
      </td>
    </tr>
  </table>
</td></tr>`;
}

function ctaButton(href: string, label: string): string {
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark});border-radius:10px;padding:16px;">
    <a href="${href}" style="color:${COLORS.white};font-size:16px;font-weight:700;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${label}</a>
  </td></tr></table>
</td></tr>`;
}

function nextTeaser(text: string): string {
  return `<tr><td align="center" style="padding:8px 24px 24px;">
  <p style="margin:0;font-size:11px;color:${COLORS.textLight};font-family:-apple-system,sans-serif;">${text}</p>
</td></tr>`;
}

function disclosureBox(): string {
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
    <tr><td style="padding:14px 16px;">
      <p style="margin:0;font-size:12px;color:${COLORS.textLight};line-height:1.5;font-family:-apple-system,sans-serif;">These are affiliate links. If you buy through them, we earn a small commission at no extra cost to you. We only recommend products we\u2019d use ourselves.</p>
    </td></tr>
  </table>
</td></tr>`;
}

function quickFact(stat: string, text: string): string {
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
    <tr><td style="padding:20px 16px;" align="center">
      <p style="margin:0;font-size:32px;font-weight:700;color:${COLORS.accent};font-family:Georgia,serif;line-height:1;">${stat}</p>
      <p style="margin:8px 0 0;font-size:14px;color:${COLORS.textMuted};line-height:1.5;font-family:Georgia,serif;">${text}</p>
    </td></tr>
  </table>
</td></tr>`;
}

function contentBlock(html: string): string {
  return `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr><td style="padding:24px;">
      ${html}
    </td></tr>
  </table>
</td></tr>`;
}

/* ── Day builders ──────────────────────────────────────────────── */

function buildDay0(sub: SubscriberSequenceState): string {
  const { safetyScore, scoreGrade, contaminantsFlagged, topConcerns, pfasDetected } =
    sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;
  // Use a reasonable tested count based on flagged
  const tested = Math.max(contaminantsFlagged + 10, 15);

  let proseHtml = "";
  if (contaminantsFlagged > 0) {
    proseHtml += p(
      `We analysed the latest available data for <strong style="color:${COLORS.white};">${pc}</strong> and flagged <strong style="color:${COLORS.white};">${contaminantsFlagged} contaminant${contaminantsFlagged > 1 ? "s" : ""}</strong> worth knowing about: ${topConcerns.join(", ")}.`,
    );
  } else {
    proseHtml += p(
      `We analysed the latest available data for <strong style="color:${COLORS.white};">${pc}</strong>. No contaminants were flagged above concerning levels. That\u2019s good news.`,
    );
  }

  if (pfasDetected) {
    proseHtml += p(
      `<strong style="color:${COLORS.danger};">PFAS detected.</strong> These \u201cforever chemicals\u201d don\u2019t break down and can build up over time. We\u2019ll cover what you can do about them in a follow-up.`,
    );
  }

  proseHtml += p(
    `The national average is around 7.0 out of 10. ` +
      (safetyScore >= 7
        ? `Your area is performing well \u2014 but we\u2019ll keep monitoring.`
        : `Your area has room for improvement, and we\u2019ll help you understand what that means.`),
  );

  let inner = "";
  inner += logoHeader();
  inner += scoreCentrepiece(safetyScore, scoreGrade, pc);
  inner += statPills(tested, contaminantsFlagged, pfasDetected);
  inner += contaminantRows(topConcerns);
  inner += contentBlock(proseHtml);
  inner += ctaButton(`${BASE_URL}/postcode/${pc}/`, "View your full report");
  inner += nextTeaser("Next up: what the contaminants in your water actually mean \u2014 in plain English.");

  return emailShell(inner, sub);
}

function buildDay3(sub: SubscriberSequenceState): string {
  const { topConcerns } = sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;

  let inner = "";
  inner += logoHeader("Briefing #2");

  if (topConcerns.length > 0) {
    const concern = topConcerns[0];
    const explainer = CONTAMINANT_EXPLAINERS[concern];

    if (explainer) {
      inner += topicHeader(
        concern,
        "Found in your water",
        concern.toLowerCase().includes("pfas") ? "#7f1d1d" : "#1e3a5f",
        concern.toLowerCase().includes("pfas") ? "#991b1b" : "#0f172a",
        concern.toLowerCase().includes("pfas") ? COLORS.danger : COLORS.accent,
      );

      let proseHtml = "";
      proseHtml += heading("Where it comes from");
      proseHtml += p(explainer.source);
      proseHtml += heading("Why it matters");
      proseHtml += p(explainer.risk);
      proseHtml += heading("What you can do");
      proseHtml += p(explainer.fix);
      inner += contentBlock(proseHtml);

      inner += quickFact(explainer.stat, explainer.statLabel);
    } else {
      inner += topicHeader(concern, "Found in your water", "#1e3a5f", "#0f172a", COLORS.accent);
      let proseHtml = "";
      proseHtml += p(
        `${concern} was found in the water supply for ${pc}. While it doesn\u2019t necessarily mean your water is unsafe, it\u2019s worth understanding what this means.`,
      );
      proseHtml += p(
        `Check your full report for detailed readings and how your area compares to UK limits.`,
      );
      inner += contentBlock(proseHtml);
    }

    if (topConcerns.length > 1) {
      inner += contentBlock(
        p(`We also flagged: <strong style="color:${COLORS.white};">${topConcerns.slice(1).join(", ")}</strong>. You can read about each on your full report.`),
      );
    }
  } else {
    inner += topicHeader("Your water looks good", "Water quality update", "#064e3b", "#0f172a", COLORS.safe);
    let proseHtml = "";
    proseHtml += p(
      `We didn\u2019t flag any contaminants at concerning levels in ${pc}. Your water supply is looking good based on the latest data.`,
    );
    proseHtml += p(
      "We\u2019ll keep monitoring and let you know if anything changes. In the meantime, you can always check your full report.",
    );
    inner += contentBlock(proseHtml);
  }

  inner += ctaButton(
    `${BASE_URL}/postcode/${pc}/`,
    "View your full report",
  );
  inner += nextTeaser("Next up: the filters that actually fix what\u2019s in your water.");

  return emailShell(inner, sub);
}

function buildDay7(sub: SubscriberSequenceState): string {
  const { topConcerns, contaminantsFlagged } = sub.waterDataSnapshot;
  const pc = sub.postcodeDistrict;
  const filters = recommendFilters(topConcerns, 3);

  let inner = "";
  inner += logoHeader("Briefing #3");
  inner += topicHeader(
    contaminantsFlagged > 0
      ? `The ${Math.min(contaminantsFlagged, 3)} filter${contaminantsFlagged !== 1 ? "s" : ""} that fix what\u2019s in ${pc}\u2019s water`
      : `The best water filters for ${pc}`,
    "Recommended for you",
    "#064e3b",
    "#0f172a",
    COLORS.safe,
  );

  if (filters.length > 0) {
    // Hero card for top pick
    const top = filters[0];
    inner += heroProductCard(
      {
        brand: top.brand,
        model: top.model,
        category: top.category,
        certifications: top.certifications,
        priceGbp: top.priceGbp,
        rating: top.rating,
        bestFor: top.bestFor,
        removes: top.removes,
        affiliateUrl: top.affiliateUrl,
        affiliateProgram: top.affiliateProgram,
      },
      pc,
    );

    // Budget cards for alternatives
    for (const f of filters.slice(1)) {
      inner += budgetProductCard({
        brand: f.brand,
        model: f.model,
        priceGbp: f.priceGbp,
        affiliateUrl: f.affiliateUrl,
      });
    }
  } else {
    inner += contentBlock(
      p("We haven\u2019t found specific filter matches for your area\u2019s contaminant profile yet. Browse our full catalogue to find what works for you."),
    );
  }

  inner += disclosureBox();
  inner += ctaButton(`${BASE_URL}/filters/`, "See all recommended filters");
  inner += nextTeaser("Next up: is it your pipes or the water supply? One test tells you.");

  return emailShell(inner, sub);
}

function buildDay14(sub: SubscriberSequenceState): string {
  const pc = sub.postcodeDistrict;

  let inner = "";
  inner += logoHeader("Briefing #4");
  inner += topicHeader(
    "Is it your pipes or the water supply?",
    "Home testing",
    "#3b0764",
    "#1e1b4b",
    "#c084fc",
  );

  let proseHtml = "";
  proseHtml += p(
    `Our data for <strong style="color:${COLORS.white};">${pc}</strong> comes from your water company\u2019s published test results. But every home is different.`,
  );
  proseHtml += p(
    "Older pipes, local plumbing, and the distance from the treatment works can all affect what comes out of your tap. The only way to know for sure is to test your water at home.",
  );
  proseHtml += p(
    "A home test kit takes a few minutes to collect a sample, and results come back within days. It tells you exactly what\u2019s in your water \u2014 not just what\u2019s in the supply.",
  );
  inner += contentBlock(proseHtml);

  // Tap Score premium recommendation
  inner += `<tr><td style="padding:0 24px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
    <tr><td style="background:#3b0764;padding:10px 16px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#c084fc;font-family:-apple-system,sans-serif;">Most comprehensive</p>
    </td></tr>
    <tr><td style="background:${COLORS.card};padding:16px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${COLORS.white};font-family:Georgia,serif;">Tap Score</p>
      <p style="margin:0 0 12px;font-size:13px;color:${COLORS.textMuted};font-family:-apple-system,sans-serif;">Lab-certified &middot; Tests 100+ contaminants &middot; From &pound;129</p>
      <p style="margin:0;font-size:14px;color:${COLORS.textMuted};line-height:1.5;font-family:Georgia,serif;">The gold standard for home water testing. Detailed lab results with health-risk context for every contaminant.</p>
    </td></tr>
  </table>
</td></tr>`;

  // SJ WAVE budget
  inner += `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
    <tr>
      <td style="padding:14px 16px;">
        <p style="margin:0;font-size:15px;color:${COLORS.white};font-family:Georgia,serif;">SJ WAVE 16-in-1 Test Strips</p>
        <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textMuted};font-family:-apple-system,sans-serif;">Quick screen &middot; From &pound;12</p>
      </td>
      <td align="right" style="padding:14px 16px;">
        <a href="${BASE_URL}/filters/testing-kits/" style="color:${COLORS.accent};font-size:13px;font-weight:600;text-decoration:none;font-family:-apple-system,sans-serif;">View &rarr;</a>
      </td>
    </tr>
  </table>
</td></tr>`;

  inner += disclosureBox();
  inner += ctaButton(`${BASE_URL}/filters/testing-kits/`, "Browse testing kits");
  inner += nextTeaser("Your monthly water quality update arrives in a couple of weeks.");

  return emailShell(inner, sub);
}

function buildDay30(sub: SubscriberSequenceState): string {
  const pc = sub.postcodeDistrict;
  const { safetyScore, scoreGrade } = sub.waterDataSnapshot;

  let inner = "";
  inner += logoHeader("Monthly Update");
  inner += scoreCentrepiece(safetyScore, scoreGrade, pc);

  let proseHtml = "";
  proseHtml += p(
    `It\u2019s been a month since your first water quality update for <strong style="color:${COLORS.white};">${pc}</strong>. Here\u2019s where things stand.`,
  );
  proseHtml += p(
    `Your area currently scores <strong style="color:${COLORS.white};">${safetyScore} out of 10</strong> (${scoreGrade}). Water quality data is updated regularly as new testing results come in \u2014 check your report for the latest numbers.`,
  );
  proseHtml += p(
    "If you found TapWater.uk useful, share it with someone who might want to check their water too.",
  );
  inner += contentBlock(proseHtml);

  inner += ctaButton(`${BASE_URL}/postcode/${pc}/`, `See latest results for ${pc}`);

  // Soft product reminder
  inner += `<tr><td style="padding:0 24px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
    <tr><td style="padding:16px;" align="center">
      <p style="margin:0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;font-family:Georgia,serif;">Still thinking about a filter? <a href="${BASE_URL}/filters/" style="color:${COLORS.accent};text-decoration:none;font-weight:600;">See our latest recommendations</a></p>
    </td></tr>
  </table>
</td></tr>`;

  return emailShell(inner, sub);
}

/* ── Public API (unchanged logic) ──────────────────────────────── */

export function getNextEmail(
  sub: SubscriberSequenceState,
): SequenceEmail | null {
  const currentIndex =
    sub.lastEmailSent === null ? -1 : SEQUENCE_STEPS.indexOf(sub.lastEmailSent);
  const nextIndex = currentIndex + 1;
  if (nextIndex >= SEQUENCE_STEPS.length) return null;
  const step = SEQUENCE_STEPS[nextIndex];
  return { step, subject: getSubject(sub, step), html: buildEmailHtml(sub, step) };
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
