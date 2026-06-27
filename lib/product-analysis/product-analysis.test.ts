import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDetectionConfidenceLevel,
  normalizeProductAnalysis,
  resolveProductName,
} from "./types";

describe("product image identification", () => {
  it("uses exact model only for high confidence with visual evidence", () => {
    const analysis = normalizeProductAnalysis({
      generic_product_name: "Samsung Galaxy smartphone",
      exact_model: "Samsung Galaxy S25 Ultra",
      product_name: "Samsung Galaxy S25 Ultra",
      category: "Smartphones",
      product_description: "Premium Android flagship.",
      product_tags: ["5G"],
      usps: ["Pro camera"],
      target_audience: ["Tech enthusiasts"],
      suggested_ad_angles: ["Flagship power"],
      recommended_tone: "Premium",
      identification_confidence: "high",
      confidence_score: 92,
    });

    assert.ok(analysis);
    assert.equal(analysis!.product_name, "Samsung Galaxy S25 Ultra");
    assert.equal(analysis!.detection_confidence, "high");
  });

  it("falls back to generic product name for medium confidence", () => {
    const analysis = normalizeProductAnalysis({
      generic_product_name: "Apple iPhone",
      exact_model: "iPhone 15 Pro",
      product_name: "iPhone 15 Pro",
      category: "Smartphones",
      product_description: "Sleek smartphone.",
      product_tags: ["iOS"],
      usps: ["Premium build"],
      target_audience: ["Professionals"],
      suggested_ad_angles: ["Everyday premium"],
      recommended_tone: "Clean",
      identification_confidence: "medium",
      confidence_score: 68,
    });

    assert.ok(analysis);
    assert.equal(analysis!.product_name, "Apple iPhone");
    assert.equal(analysis!.detection_confidence, "medium");
  });

  it("falls back to generic product name for low confidence", () => {
    const analysis = normalizeProductAnalysis({
      generic_product_name: "Nike running shoe",
      exact_model: null,
      product_name: "Nike Air Zoom Pegasus 40",
      category: "Footwear",
      product_description: "Lightweight running shoe.",
      product_tags: ["Running"],
      usps: ["Cushioned"],
      target_audience: ["Runners"],
      suggested_ad_angles: ["Daily miles"],
      recommended_tone: "Energetic",
      identification_confidence: "low",
      confidence_score: 42,
    });

    assert.ok(analysis);
    assert.equal(analysis!.product_name, "Nike running shoe");
    assert.equal(analysis!.detection_confidence, "low");
  });

  it("downgrades inflated AI confidence using the numeric score", () => {
    const level = getDetectionConfidenceLevel(55);
    assert.equal(level, "low");

    const analysis = normalizeProductAnalysis({
      generic_product_name: "Sony wireless headphones",
      exact_model: "Sony WH-1000XM5",
      product_name: "Sony WH-1000XM5",
      category: "Audio",
      product_description: "Over-ear headphones.",
      product_tags: ["Wireless"],
      usps: ["Noise cancelling"],
      target_audience: ["Commuters"],
      suggested_ad_angles: ["Block the noise"],
      recommended_tone: "Premium",
      identification_confidence: "high",
      confidence_score: 55,
    });

    assert.ok(analysis);
    assert.equal(analysis!.detection_confidence, "low");
    assert.equal(analysis!.product_name, "Sony wireless headphones");
  });

  it("resolveProductName never returns exact model unless confidence is high", () => {
    assert.equal(
      resolveProductName(
        {
          generic_product_name: "Samsung Galaxy smartphone",
          exact_model: "Samsung Galaxy S25",
        },
        "medium"
      ),
      "Samsung Galaxy smartphone"
    );
  });
});
