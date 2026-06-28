import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBrandKitPromptSection,
} from "@/lib/brand-kit/server";
import { DEFAULT_BRAND_KIT } from "@/lib/brand-kit/types";
import { validateBrandKit } from "@/lib/brand-kit/validation";

describe("brand kit", () => {
  it("normalizes and validates saved brand kit settings", () => {
    const result = validateBrandKit({
      brandName: " Advora ",
      websiteUrl: "useadvora.com",
      brandVoice: "Custom",
      customBrandVoice: "Write like Apple.",
      primaryColor: "#8B5CF6",
      secondaryColor: "#22D3EE",
      ctaColor: "#EC4899",
      captionLength: "Long",
      emojiUsage: "High",
      ctaStyle: "Urgent",
      writingStyle: "Storytelling",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.brandName, "Advora");
      assert.equal(result.value.websiteUrl, "https://useadvora.com/");
      assert.equal(result.value.primaryColor, "#8b5cf6");
      assert.equal(result.value.brandVoice, "Custom");
    }
  });

  it("requires custom voice text when Custom is selected", () => {
    const result = validateBrandKit({
      ...DEFAULT_BRAND_KIT,
      brandVoice: "Custom",
      customBrandVoice: "",
    });

    assert.equal(result.ok, false);
  });

  it("formats brand kit instructions for AI generation", () => {
    const section = buildBrandKitPromptSection({
      ...DEFAULT_BRAND_KIT,
      brandName: "Advora",
      industry: "Software",
      targetAudience: "DTC founders",
      usp: "Generate premium ads faster",
      brandVoice: "Premium Tech",
    });

    assert.match(section ?? "", /Brand Kit:/);
    assert.match(section ?? "", /Advora/);
    assert.match(section ?? "", /Premium Tech/);
    assert.match(section ?? "", /Generate premium ads faster/);
  });
});
