import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFeatureAccessMap,
  canAccessFeature,
  resolveEffectivePlan,
} from "./features";
import {
  clampAiPreferencesForPlan,
  validateAiPreferencesForPlan,
} from "./ai-preferences-plan";
import { DEFAULT_AI_PREFERENCES } from "@/lib/settings/ai-preferences";

describe("resolveEffectivePlan", () => {
  it("treats inactive paid plans as free", () => {
    assert.equal(resolveEffectivePlan("starter", "inactive"), "free");
    assert.equal(resolveEffectivePlan("pro", "cancelled"), "free");
  });

  it("keeps active paid plans", () => {
    assert.equal(resolveEffectivePlan("starter", "active"), "starter");
    assert.equal(resolveEffectivePlan("pro", "active"), "pro");
    assert.equal(resolveEffectivePlan("custom", "active"), "custom");
  });
});

describe("canAccessFeature", () => {
  it("allows core generation features on free", () => {
    assert.equal(canAccessFeature("free", "inactive", "hooks"), true);
    assert.equal(canAccessFeature("free", "inactive", "captions"), true);
    assert.equal(canAccessFeature("free", "inactive", "cta"), true);
    assert.equal(canAccessFeature("free", "inactive", "ugc_script"), true);
  });

  it("blocks premium tools on free", () => {
    assert.equal(canAccessFeature("free", "inactive", "brand_kit"), false);
    assert.equal(
      canAccessFeature("free", "inactive", "competitor_analyzer"),
      false
    );
    assert.equal(
      canAccessFeature("free", "inactive", "advanced_ai_preferences"),
      false
    );
    assert.equal(
      canAccessFeature("free", "inactive", "premium_ai_quality"),
      false
    );
  });

  it("unlocks starter features for active starter", () => {
    assert.equal(canAccessFeature("starter", "active", "brand_kit"), true);
    assert.equal(
      canAccessFeature("starter", "active", "social_scheduler"),
      true
    );
    assert.equal(
      canAccessFeature("starter", "active", "premium_ai_quality"),
      false
    );
  });

  it("unlocks pro-only features for active pro", () => {
    assert.equal(
      canAccessFeature("pro", "active", "premium_ai_quality"),
      true
    );
    assert.equal(canAccessFeature("pro", "active", "priority_processing"), true);
  });
});

describe("buildFeatureAccessMap", () => {
  it("returns a full access map", () => {
    const map = buildFeatureAccessMap("starter", "active");
    assert.equal(map.brand_kit, true);
    assert.equal(map.premium_ai_quality, false);
  });
});

describe("AI preferences plan enforcement", () => {
  it("clamps advanced preferences for free users", () => {
    const clamped = clampAiPreferencesForPlan(
      {
        ...DEFAULT_AI_PREFERENCES,
        platform: "TikTok",
        creativeLevel: 90,
        generationQuality: "Premium",
      },
      "free",
      "inactive"
    );

    assert.equal(clamped.platform, DEFAULT_AI_PREFERENCES.platform);
    assert.equal(clamped.creativeLevel, DEFAULT_AI_PREFERENCES.creativeLevel);
    assert.equal(
      clamped.generationQuality,
      DEFAULT_AI_PREFERENCES.generationQuality
    );
  });

  it("rejects premium quality saves on starter", () => {
    const result = validateAiPreferencesForPlan(
      {
        ...DEFAULT_AI_PREFERENCES,
        generationQuality: "Premium",
      },
      "starter",
      "active"
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.feature, "premium_ai_quality");
    }
  });
});
