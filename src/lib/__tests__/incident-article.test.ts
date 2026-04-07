import { describe, it, expect } from "vitest";
import { validateArticle, generateFallbackArticle } from "@/lib/incident-article";

describe("validateArticle", () => {
  it("accepts valid article", () => {
    const result = validateArticle({
      title: "Boil Notice: South London",
      summary: "Thames Water has issued a boil notice for SE5 and SE15.",
      article_markdown: "Thames Water has issued a precautionary boil notice. ".repeat(10),
    });
    expect(result.valid).toBe(true);
  });

  it("rejects title over 80 chars", () => {
    const result = validateArticle({
      title: "A".repeat(81),
      summary: "Short summary",
      article_markdown: "Content. ".repeat(30),
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("title");
  });

  it("rejects summary over 200 chars", () => {
    const result = validateArticle({
      title: "Valid Title",
      summary: "A".repeat(201),
      article_markdown: "Content. ".repeat(30),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects article under 200 words", () => {
    const result = validateArticle({
      title: "Valid Title",
      summary: "Valid summary",
      article_markdown: "Too short.",
    });
    expect(result.valid).toBe(false);
  });
});

describe("generateFallbackArticle", () => {
  it("generates structured article from raw data", () => {
    const result = generateFallbackArticle({
      type: "boil_notice",
      source: "water_company",
      source_url: "https://example.com",
      affected_postcodes: ["SE5", "SE15"],
      affected_cities: ["london"],
      action_required: "Boil all water before drinking.",
      raw_description: "Thames Water has issued a boil notice.",
      supplier_id: "thames-water",
      source_hash: "test",
      severity: "critical",
      households_affected: 45000,
      source_data: {},
    });
    expect(result.title.length).toBeLessThanOrEqual(80);
    expect(result.summary.length).toBeLessThanOrEqual(200);
    expect(result.article_markdown).toContain("SE5");
    expect(result.article_markdown).toContain("Boil all water");
  });
});
