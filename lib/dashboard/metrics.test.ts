import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDashboardMetrics,
  resolveCurrentCycleUsage,
} from "@/lib/dashboard/metrics";
import type { GenerationRecord } from "@/lib/history/types";

function generation(
  id: string,
  overrides: Partial<GenerationRecord> = {}
): GenerationRecord {
  return {
    id,
    product_description: `Real product ${id}`,
    created_at: new Date().toISOString(),
    hooks: [`Hook ${id}`],
    captions: [`Caption ${id}`],
    ctas: [`CTA ${id}`],
    ugc_script: `Script ${id}`,
    user_email: "user@example.com",
    ...overrides,
  };
}

describe("dashboard metrics", () => {
  it("caps free current-cycle ads to credits used", () => {
    const generations = Array.from({ length: 33 }, (_, index) =>
      generation(String(index + 1))
    );

    const metrics = computeDashboardMetrics(generations, "free", {
      maxCredits: 5,
      remainingCredits: 0,
      unlimited: false,
    });

    assert.equal(metrics.adsThisMonth, 5);
  });

  it("ignores failed, duplicate, and mock generations", () => {
    const duplicate = generation("duplicate", {
      product_description: "Real duplicated product",
      hooks: ["Same hook"],
      captions: ["Same caption"],
      ctas: ["Same CTA"],
      ugc_script: "Same script",
    });

    const metrics = computeDashboardMetrics(
      [
        generation("1"),
        generation("failed", {
          hooks: [],
          captions: [],
          ctas: [],
          ugc_script: "",
        }),
        generation("mock", {
          product_description: "Mock development product",
        }),
        duplicate,
        {
          ...duplicate,
          id: "duplicate-copy",
        },
      ],
      "free",
      {
        maxCredits: 5,
        remainingCredits: 2,
        unlimited: false,
      }
    );

    assert.equal(metrics.totalAds, 2);
    assert.equal(metrics.adsThisMonth, 2);
  });

  it("resets metered usage when credits reset", () => {
    assert.equal(
      resolveCurrentCycleUsage(5, {
        maxCredits: 5,
        remainingCredits: 5,
        unlimited: false,
      }),
      0
    );
  });

  it("uses successful current-cycle history for unlimited plans", () => {
    assert.equal(
      resolveCurrentCycleUsage(42, {
        maxCredits: null,
        remainingCredits: 0,
        unlimited: true,
      }),
      42
    );
  });

  it("uses the latest successful current-cycle generation for last generation time", () => {
    const latest = new Date().toISOString();
    const older = new Date(Date.now() - 60_000).toISOString();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const metrics = computeDashboardMetrics(
      [
        generation("older", { created_at: older }),
        generation("failed", {
          created_at: new Date(Date.now() + 60_000).toISOString(),
          hooks: [],
          captions: [],
          ctas: [],
          ugc_script: "",
        }),
        generation("mock", {
          created_at: new Date(Date.now() + 120_000).toISOString(),
          product_description: "Mock product",
        }),
        generation("latest", { created_at: latest }),
        generation("last-month", { created_at: lastMonth.toISOString() }),
      ],
      "free",
      {
        maxCredits: 5,
        remainingCredits: 3,
        unlimited: false,
      }
    );

    assert.equal(metrics.adsThisMonth, 2);
    assert.equal(metrics.lastGenerationIso, latest);
  });

  it("returns no last generation when current-cycle usage is zero", () => {
    const metrics = computeDashboardMetrics([generation("old")], "free", {
      maxCredits: 5,
      remainingCredits: 5,
      unlimited: false,
    });

    assert.equal(metrics.adsThisMonth, 0);
    assert.equal(metrics.lastGenerationIso, null);
  });
});
