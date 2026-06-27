import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampScore,
  computeConversionScore,
  computeWeightedAverage,
  getScoreColor,
  getScoreLabel,
} from "./scores";
import {
  extractImportantContent,
  extractTitle,
  extractMetaDescription,
} from "./extract-content";
import { normalizeLandingPageAnalysis } from "./types";
import { buildLandingAnalysisPrompt } from "./prompt";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FORBIDDEN_HARDCODED_SCORES = [82, 78, 70, 65, 74];

function mockAnalysisPayload(overrides: {
  brand?: string;
  summary?: string;
  scores: Record<string, number | string>;
  conversion_score?: number;
}) {
  return {
    brand_product_name: overrides.brand ?? "Test Brand",
    product_category: "SaaS",
    hero_headline: "Headline",
    value_proposition: "Value prop",
    primary_cta: "Get started",
    target_audience: ["Marketers"],
    key_usps: ["Fast setup"],
    pain_points: ["Low conversion"],
    emotional_triggers: ["Growth"],
    trust_signals: ["Logos"],
    offer: "Free trial",
    social_proof: "10k customers",
    marketing_summary: overrides.summary ?? "Marketing summary for test page.",
    strengths: ["Clear headline"],
    weaknesses: ["Weak CTA"],
    scores: overrides.scores,
    ...(overrides.conversion_score !== undefined
      ? { conversion_score: overrides.conversion_score }
      : {}),
    suggestions: {
      better_headline: "Better headline",
      better_cta: "Start free",
      missing_trust_elements: ["Reviews"],
      better_offer: "14-day trial",
      ux_improvements: ["Add social proof"],
    },
    ad_strategy: {
      ad_angles: ["a1", "a2", "a3", "a4", "a5"],
      hooks: ["h1", "h2", "h3", "h4", "h5"],
      captions: ["c1", "c2", "c3"],
      ctas: ["cta1", "cta2", "cta3"],
    },
  };
}

describe("landing analyzer scoring", () => {
  it("computes overall score as the weighted average of all component scores", () => {
    const inputs = {
      hero_score: 92,
      cta_score: 88,
      trust_score: 94,
      offer_score: 86,
      copy_score: 93,
      social_proof_score: 90,
      visual_hierarchy_score: 91,
      mobile_ux_score: 89,
    };

    const overall = computeConversionScore(inputs);
    assert.equal(overall, computeWeightedAverage(inputs));
    assert.equal(overall, computeConversionScore(inputs));
    assert.ok(overall >= 85, "exceptional pages should score 85+");
  });

  it("does not deflate overall when only visible component scores are returned", () => {
    const visibleOnly = {
      hero_score: 88,
      cta_score: 72,
      trust_score: 85,
      offer_score: 65,
      copy_score: 0,
      social_proof_score: 0,
      visual_hierarchy_score: 0,
      mobile_ux_score: 0,
    };

    const overall = computeConversionScore(visibleOnly);

    assert.equal(overall, computeWeightedAverage(visibleOnly));
    assert.ok(
      overall >= 75 && overall <= 82,
      `expected overall near visible average, got ${overall}`
    );
    assert.notEqual(overall, 29);
  });

  it("always matches normalizeLandingPageAnalysis conversion_score to weighted average", () => {
    const payload = mockAnalysisPayload({
      conversion_score: 29,
      scores: {
        hero_score: 88,
        cta_score: 72,
        trust_score: 85,
        offer_score: 65,
      },
    });

    const analysis = normalizeLandingPageAnalysis(payload, "https://example.com");
    assert.ok(analysis);

    const expected = computeConversionScore({
      hero_score: 88,
      cta_score: 72,
      trust_score: 85,
      offer_score: 65,
      copy_score: 0,
      social_proof_score: 0,
      visual_hierarchy_score: 0,
      mobile_ux_score: 0,
    });

    assert.equal(analysis!.scores.conversion_score, expected);
    assert.notEqual(analysis!.scores.conversion_score, 29);
  });

  it("reflects a weak CTA in the weighted average without hidden zero-score penalty", () => {
    const mixed = {
      hero_score: 92,
      cta_score: 32,
      trust_score: 88,
      offer_score: 70,
      copy_score: 90,
      social_proof_score: 85,
      visual_hierarchy_score: 87,
      mobile_ux_score: 80,
    };

    const overall = computeConversionScore(mixed);
    assert.equal(overall, computeWeightedAverage(mixed));
    assert.ok(overall >= 65 && overall <= 80);
    assert.ok(overall < mixed.hero_score);
  });

  it("produces different overall scores for weak, average, good, and exceptional pages", () => {
    const weak = normalizeLandingPageAnalysis(
      mockAnalysisPayload({
        brand: "Weak Co",
        summary: "Unclear offer, no trust, weak CTA.",
        scores: {
          hero_score: 28,
          cta_score: 22,
          trust_score: 25,
          offer_score: 30,
          copy_score: 35,
          social_proof_score: 18,
          visual_hierarchy_score: 32,
          mobile_ux_score: 27,
        },
      }),
      "https://weak-example.com"
    );

    const average = normalizeLandingPageAnalysis(
      mockAnalysisPayload({
        brand: "Average Co",
        summary: "Decent messaging with mixed trust and CTA clarity.",
        scores: {
          hero_score: 58,
          cta_score: 52,
          trust_score: 55,
          offer_score: 60,
          copy_score: 57,
          social_proof_score: 50,
          visual_hierarchy_score: 54,
          mobile_ux_score: 56,
        },
      }),
      "https://average-example.com"
    );

    const good = normalizeLandingPageAnalysis(
      mockAnalysisPayload({
        brand: "Good Co",
        summary: "Clear value prop with solid CTA and trust signals.",
        scores: {
          hero_score: 78,
          cta_score: 74,
          trust_score: 76,
          offer_score: 72,
          copy_score: 80,
          social_proof_score: 71,
          visual_hierarchy_score: 77,
          mobile_ux_score: 75,
        },
      }),
      "https://good-example.com"
    );

    const exceptional = normalizeLandingPageAnalysis(
      mockAnalysisPayload({
        brand: "Stripe",
        summary: "World-class clarity, trust, and product copy.",
        scores: {
          hero_score: 92,
          cta_score: 88,
          trust_score: 94,
          offer_score: 86,
          copy_score: 93,
          social_proof_score: 90,
          visual_hierarchy_score: 91,
          mobile_ux_score: 89,
        },
      }),
      "https://stripe.com"
    );

    assert.ok(weak && average && good && exceptional);

    const scores = [
      weak!.scores.conversion_score,
      average!.scores.conversion_score,
      good!.scores.conversion_score,
      exceptional!.scores.conversion_score,
    ];

    assert.ok(scores[0] >= 20 && scores[0] <= 45, "weak page lands in 20–45 band");
    assert.ok(scores[1] >= 46 && scores[1] <= 69, "average page lands in 46–69 band");
    assert.ok(scores[2] >= 70 && scores[2] <= 84, "good page lands in 70–84 band");
    assert.ok(scores[3] >= 85 && scores[3] <= 100, "exceptional page lands in 85–100 band");

    assert.equal(new Set(scores).size, 4, "each tier must produce a distinct overall score");
  });

  it("ignores AI-provided conversion_score and computes server-side", () => {
    const payload = mockAnalysisPayload({
      conversion_score: 82,
      scores: {
        hero_score: 50,
        cta_score: 50,
        trust_score: 50,
        offer_score: 50,
        copy_score: 50,
        social_proof_score: 50,
        visual_hierarchy_score: 50,
        mobile_ux_score: 50,
      },
    });

    const analysis = normalizeLandingPageAnalysis(
      payload,
      "https://example.com"
    );

    assert.ok(analysis);
    assert.equal(analysis!.scores.conversion_score, 50);
    assert.notEqual(analysis!.scores.conversion_score, 82);
  });

  it("supports legacy score field names from older AI responses", () => {
    const payload = mockAnalysisPayload({
      scores: {
        hero_score: 80,
        cta_score: 70,
        trust_score: 75,
        offer_score: 65,
        value_proposition_score: 82,
        content_clarity_score: 78,
        social_proof_score: 72,
        conversion_optimization_score: 68,
      },
    });

    const analysis = normalizeLandingPageAnalysis(payload, "https://legacy.com");
    assert.ok(analysis);
    assert.equal(
      analysis!.scores.conversion_score,
      computeWeightedAverage({
        hero_score: 80,
        cta_score: 70,
        trust_score: 75,
        offer_score: 65,
        copy_score: 80,
        social_proof_score: 72,
        visual_hierarchy_score: 78,
        mobile_ux_score: 68,
      })
    );
  });

  it("rejects analyses with no valid component scores", () => {
    const payload = mockAnalysisPayload({
      scores: {
        hero_score: 0,
        cta_score: 0,
        trust_score: 0,
        offer_score: 0,
        copy_score: 0,
        social_proof_score: 0,
        visual_hierarchy_score: 0,
        mobile_ux_score: 0,
      },
    });

    assert.equal(normalizeLandingPageAnalysis(payload, "https://example.com"), null);
  });

  it("parses numeric strings from AI score fields", () => {
    const payload = mockAnalysisPayload({
      scores: {
        hero_score: "77",
        cta_score: "63",
        trust_score: "81",
        offer_score: "69",
        copy_score: "74",
        social_proof_score: "66",
        visual_hierarchy_score: "70",
        mobile_ux_score: "72",
      },
    });

    const analysis = normalizeLandingPageAnalysis(payload, "https://apple.com");
    assert.ok(analysis);
    assert.equal(analysis!.scores.hero_score, 77);
    assert.equal(analysis!.scores.cta_score, 63);
  });

  it("treats literal integer placeholders as invalid scores", () => {
    assert.equal(clampScore("integer"), 0);
  });

  it("maps score colors and labels by updated ranges", () => {
    assert.equal(getScoreColor(35), "#EF4444");
    assert.equal(getScoreColor(39), "#EF4444");
    assert.equal(getScoreColor(40), "#FACC15");
    assert.equal(getScoreColor(69), "#FACC15");
    assert.equal(getScoreColor(70), "#22C55E");
    assert.equal(getScoreColor(95), "#22C55E");

    assert.equal(getScoreLabel(35), "Needs Improvement");
    assert.equal(getScoreLabel(55), "Average");
    assert.equal(getScoreLabel(75), "Good");
    assert.equal(getScoreLabel(90), "Excellent");
  });

  it("does not embed hardcoded example scores in the AI prompt", () => {
    const promptSource = readFileSync(join(__dirname, "prompt.ts"), "utf8");

    for (const score of FORBIDDEN_HARDCODED_SCORES) {
      assert.equal(
        promptSource.includes(`"conversion_score": ${score}`),
        false,
        `prompt must not contain hardcoded conversion_score ${score}`
      );
      assert.equal(
        promptSource.includes(`"hero_score": ${score}`),
        false,
        `prompt must not contain hardcoded hero_score ${score}`
      );
    }

    const samplePrompt = buildLandingAnalysisPrompt({
      url: "https://stripe.com",
      title: "Stripe",
      metaDescription: "Payments",
      textContent: "Accept payments online.",
    });

    assert.match(samplePrompt, /Do NOT return conversion_score/);
    assert.match(samplePrompt, /copy_score/);
    assert.match(samplePrompt, /visual_hierarchy_score/);
    assert.match(samplePrompt, /mobile_ux_score/);
    assert.doesNotMatch(samplePrompt, /"hero_score": 82/);
  });

  it("extracts structured marketing content instead of raw HTML", () => {
    const html = `
      <html>
        <head>
          <title>Acme SaaS</title>
          <meta name="description" content="Ship faster with Acme." />
          <style>.hidden{display:none}</style>
          <script>window.data = Array(99999).fill("noise")</script>
        </head>
        <body>
          <header class="hero">
            <h1>Ship products faster</h1>
            <p>The all-in-one platform for modern teams.</p>
            <button>Start free trial</button>
          </header>
          <section class="pricing">
            <h2>Pricing</h2>
            <p>Pro plan $49/month</p>
          </section>
          <section class="testimonials">
            <blockquote>Acme doubled our conversion rate.</blockquote>
          </section>
          <section class="faq">
            <details><summary>How does billing work?</summary><p>Monthly or annual plans.</p></details>
          </section>
          <footer>Trusted by 10,000 teams. SOC 2 certified.</footer>
          <svg><path d="M0 0"/></svg>
        </body>
      </html>
    `;

    assert.equal(extractTitle(html), "Acme SaaS");
    assert.equal(extractMetaDescription(html), "Ship faster with Acme.");

    const extracted = extractImportantContent(html);
    assert.ok(extracted.textContent.length <= 15_000);
    assert.match(extracted.textContent, /Ship products faster/i);
    assert.match(extracted.textContent, /Start free trial/i);
    assert.match(extracted.textContent, /Pricing/i);
    assert.match(extracted.textContent, /Acme doubled our conversion rate/i);
    assert.match(extracted.textContent, /SOC 2 certified/i);
    assert.doesNotMatch(extracted.textContent, /<script/i);
    assert.doesNotMatch(extracted.textContent, /window\.data/);
  });

  it("flags oversized extracted content for summarization", () => {
    const chunk = "Enterprise value proposition detail. ".repeat(220);
    const html = `
      <html><body>
        <header class="hero"><h1>Hero ${chunk}</h1><button>Book demo</button></header>
        <section class="pricing"><h2>Pricing</h2><p>${chunk}</p></section>
        <section class="testimonials"><blockquote>${chunk}</blockquote></section>
        <section class="faq"><details><summary>FAQ</summary><p>${chunk}</p></details></section>
        <footer>Trusted by Fortune 500 companies. ${chunk}</footer>
      </body></html>
    `;

    const extracted = extractImportantContent(html);
    assert.equal(extracted.needsSummarization, true);
    assert.ok(extracted.textContent.length <= 30_000);
  });

  it("handles large downloaded HTML without failing", () => {
    const noise = "<script>void(0)</script>".repeat(5_000);
    const html = `
      <html><head><title>Big Page</title></head><body>
        ${noise}
        <header class="hero"><h1>Launch faster</h1><button>Get started</button></header>
        <footer>Trusted by 2,000 companies</footer>
      </body></html>
    `;

    const extracted = extractImportantContent(html);
    assert.ok(extracted.textContent.length <= 15_000);
    assert.match(extracted.textContent, /Launch faster/i);
    assert.doesNotMatch(extracted.textContent, /<script/i);
  });
});
