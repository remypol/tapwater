import Anthropic from "@anthropic-ai/sdk";
import type { RawIncident, GeneratedArticle } from "@/lib/incidents-types";
import { INCIDENT_TYPE_LABELS } from "@/lib/incidents-types";
import { generateSlug } from "@/lib/incidents";

// ── Validation ──

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

interface ArticleInput {
  title: string;
  summary: string;
  article_markdown: string;
}

const PROFANITY_BLOCKLIST = [
  "fuck",
  "shit",
  "cunt",
  "bastard",
  "bollocks",
  "wanker",
];

export function validateArticle(article: ArticleInput): ValidationResult {
  if (article.title.length > 80) {
    return { valid: false, reason: "title exceeds 80 characters" };
  }
  if (!article.title.trim()) {
    return { valid: false, reason: "title is empty" };
  }
  if (article.summary.length > 200) {
    return { valid: false, reason: "summary exceeds 200 characters" };
  }
  if (!article.summary.trim()) {
    return { valid: false, reason: "summary is empty" };
  }

  const wordCount = article.article_markdown
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (wordCount < 50) {
    return {
      valid: false,
      reason: `article_markdown has ${wordCount} words; minimum is 50`,
    };
  }
  if (wordCount > 1200) {
    return {
      valid: false,
      reason: `article_markdown has ${wordCount} words; maximum is 1200`,
    };
  }

  const fullText = `${article.title} ${article.summary} ${article.article_markdown}`.toLowerCase();
  for (const word of PROFANITY_BLOCKLIST) {
    if (fullText.includes(word)) {
      return { valid: false, reason: `article contains blocked content` };
    }
  }

  return { valid: true };
}

// ── Fallback template ──

export function generateFallbackArticle(raw: RawIncident): GeneratedArticle {
  const typeLabel = INCIDENT_TYPE_LABELS[raw.type];
  const postcodeList = raw.affected_postcodes.slice(0, 5).join(", ");
  const cityList = raw.affected_cities
    .map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
    .join(", ");

  // Title — max 80 chars
  const locationHint = postcodeList || cityList || "your area";
  const rawTitle = `${typeLabel}: ${locationHint}`;
  const title =
    rawTitle.length > 80 ? rawTitle.slice(0, 77) + "..." : rawTitle;

  // Summary — max 200 chars
  const source =
    raw.source === "water_company"
      ? "your water company"
      : raw.source === "environment_agency"
        ? "the Environment Agency"
        : "authorities";

  const rawSummary = raw.action_required
    ? `${source.charAt(0).toUpperCase() + source.slice(1)} has issued a ${typeLabel.toLowerCase()} notice. ${raw.action_required}`
    : `${source.charAt(0).toUpperCase() + source.slice(1)} has issued a ${typeLabel.toLowerCase()} notice affecting ${locationHint}.`;
  const summary =
    rawSummary.length > 200 ? rawSummary.slice(0, 197) + "..." : rawSummary;

  // Article body — must be 200–800 words
  const householdsNote =
    raw.households_affected
      ? ` An estimated ${raw.households_affected.toLocaleString()} households are thought to be affected.`
      : "";

  const actionSection = raw.action_required
    ? `\n\n## What you need to do\n\n${raw.action_required}\n\nPlease follow this advice until further notice is given.`
    : "";

  const postcodeSection =
    raw.affected_postcodes.length > 0
      ? `\n\n## Affected areas\n\nThe following postcode districts are affected: **${raw.affected_postcodes.join(", ")}**.`
      : "";

  const descriptionSection = raw.raw_description
    ? `\n\n## What has happened\n\n${raw.raw_description}`
    : "";

  const sourceSection = `\n\n## Source\n\nThis notice has been issued by ${source}. For the latest information and updates, visit the official source at ${raw.source_url}.`;

  const warningParagraph = `\n\nIf you have any concerns about your health, or if you have already consumed water that may be affected, please contact NHS 111 or your GP for advice.`;

  const checkParagraph = `\n\nTapWater.uk will continue to monitor this situation and update this page as new information becomes available. You can check the current status of your local water supply at any time using your postcode.`;

  const faqSection = `\n\n## Frequently asked questions\n\n**How long will this last?**\nWe do not yet have a confirmed end time for this notice. Check back here or contact your water company directly for the latest updates.\n\n**Is it safe to shower or bath?**\nFor a boil notice, it is generally safe to shower or bath, but avoid swallowing any water. For a supply interruption, check with your water company for specific guidance.\n\n**What about vulnerable people?**\nExtra care should be taken if you are caring for babies, young children, elderly people, or anyone with a weakened immune system. If in doubt, use bottled water.`;

  const article_markdown = [
    `**${typeLabel}** has been declared for ${locationHint}.${householdsNote}`,
    descriptionSection,
    actionSection,
    postcodeSection,
    sourceSection,
    warningParagraph,
    checkParagraph,
    faqSection,
  ]
    .join("")
    .trim();

  const slug = generateSlug(raw.type, raw.affected_postcodes, new Date());

  return { title, slug, summary, article_markdown };
}

// ── AI generator ──

interface AIArticleOutput {
  title: string;
  summary: string;
  article_markdown: string;
}

const SYSTEM_PROMPT = `You are a water safety communications writer for TapWater.uk, a UK public information service.

Your task is to write clear, factual water incident articles for ordinary people — not scientists. Use plain British English. Never use jargon. Be reassuring but honest.

Rules:
- Title: maximum 80 characters. No clickbait. State the type and location.
- Summary: maximum 200 characters. One or two plain sentences. No speculation.
- article_markdown: 200–800 words. Markdown formatting is allowed. Cover: what happened, what areas are affected, what people should do, where to get more information.
- Always attribute information to the original source.
- Do not invent details not present in the source data.
- British English spelling throughout (e.g. "colour", "licence", "advised").
- No emojis. No informal language. No sensationalism.

Return ONLY valid JSON with exactly these three keys: title, summary, article_markdown.
Do not include any text outside the JSON object.`;

export async function generateArticle(
  raw: RawIncident,
): Promise<GeneratedArticle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "[incident-article] ANTHROPIC_API_KEY not set — using fallback template",
    );
    return generateFallbackArticle(raw);
  }

  try {
    const client = new Anthropic({ apiKey });

    const userMessage = JSON.stringify(
      {
        type: raw.type,
        severity: raw.severity,
        source: raw.source,
        source_url: raw.source_url,
        supplier_id: raw.supplier_id,
        affected_postcodes: raw.affected_postcodes,
        affected_cities: raw.affected_cities,
        households_affected: raw.households_affected,
        action_required: raw.action_required,
        raw_description: raw.raw_description,
      },
      null,
      2,
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a water incident article for the following incident data:\n\n${userMessage}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in Claude response");
    }

    let parsed: AIArticleOutput;
    try {
      // Strip any markdown code fences if Claude wrapped the JSON
      const raw_text = textBlock.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      parsed = JSON.parse(raw_text) as AIArticleOutput;
    } catch {
      throw new Error(
        `Failed to parse Claude JSON response: ${textBlock.text.slice(0, 200)}`,
      );
    }

    if (
      typeof parsed.title !== "string" ||
      typeof parsed.summary !== "string" ||
      typeof parsed.article_markdown !== "string"
    ) {
      throw new Error("Claude response missing required fields");
    }

    const validation = validateArticle(parsed);
    if (!validation.valid) {
      console.warn(
        `[incident-article] Claude output failed validation (${validation.reason}) — using fallback`,
      );
      return generateFallbackArticle(raw);
    }

    const slug = generateSlug(raw.type, raw.affected_postcodes, new Date());

    return {
      title: parsed.title,
      slug,
      summary: parsed.summary,
      article_markdown: parsed.article_markdown,
    };
  } catch (err) {
    console.error(
      "[incident-article] Claude API error — falling back to template:",
      err instanceof Error ? err.message : String(err),
    );
    return generateFallbackArticle(raw);
  }
}
