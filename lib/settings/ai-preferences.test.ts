import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildAiPreferencesPromptSection,
  DEFAULT_AI_PREFERENCES,
  resolveOpenAiGenerationConfig,
  validateAiPreferences,
} from "./ai-preferences";

describe("AI preferences validation", () => {
  it("accepts valid preferences", () => {
    const result = validateAiPreferences({
      language: "Hindi",
      tone: "Luxury",
      captionLength: "Detailed",
      emojiUsage: "High",
      ctaStyle: "FOMO",
      creativeLevel: 80,
      generationQuality: "Premium",
      platform: "TikTok",
      audience: "Gen Z",
      brandVoice: "Bold",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.language, "Hindi");
      assert.equal(result.value.creativeLevel, 80);
    }
  });

  it("rejects invalid language", () => {
    const result = validateAiPreferences({
      ...DEFAULT_AI_PREFERENCES,
      language: "Klingon",
    });
    assert.equal(result.ok, false);
  });

  it("rejects out-of-range creative level", () => {
    const result = validateAiPreferences({
      ...DEFAULT_AI_PREFERENCES,
      creativeLevel: 150,
    });
    assert.equal(result.ok, false);
  });
});

describe("AI preferences prompt section", () => {
  it("includes language and platform guidance", () => {
    const section = buildAiPreferencesPromptSection({
      ...DEFAULT_AI_PREFERENCES,
      language: "Spanish",
      platform: "LinkedIn",
    });

    assert.match(section ?? "", /Spanish/);
    assert.match(section ?? "", /LinkedIn/);
    assert.match(section ?? "", /write ALL output in this language/i);
  });
});

describe("OpenAI generation config", () => {
  it("maps premium quality to gpt-4o", () => {
    const config = resolveOpenAiGenerationConfig({
      ...DEFAULT_AI_PREFERENCES,
      generationQuality: "Premium",
      creativeLevel: 50,
    });
    assert.equal(config.model, "gpt-4o");
  });

  it("maps fast quality to gpt-4o-mini with capped temperature", () => {
    const config = resolveOpenAiGenerationConfig({
      ...DEFAULT_AI_PREFERENCES,
      generationQuality: "Fast",
      creativeLevel: 100,
    });
    assert.equal(config.model, "gpt-4o-mini");
    assert.ok(config.temperature <= 0.75);
  });
});

describe("user AI preferences migration", () => {
  const migration = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20250724_user_ai_preferences.sql"),
    "utf8"
  );

  it("creates preferences table with constraints and RLS", () => {
    assert.match(migration, /create table if not exists public\.user_ai_preferences/);
    assert.match(migration, /user_ai_preferences_language_check/);
    assert.match(migration, /Users can read own AI preferences/);
    assert.match(migration, /Users can update own AI preferences/);
  });
});
