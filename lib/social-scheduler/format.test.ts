import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatSchedulerDateTime,
  formatSchedulerMonthYear,
  formatSchedulerPreviewFromParts,
} from "./format";

describe("social scheduler format", () => {
  it("formats ISO timestamps deterministically with en-US locale", () => {
    const formatted = formatSchedulerDateTime("2026-07-12T10:30:00.000Z");
    assert.match(formatted, /Jul/);
    assert.match(formatted, /2026/);
  });

  it("formats month labels deterministically", () => {
    const formatted = formatSchedulerMonthYear(new Date(2026, 6, 1));
    assert.equal(formatted, "July 2026");
  });

  it("returns stable preview placeholder when date is empty", () => {
    assert.equal(
      formatSchedulerPreviewFromParts("", "10:00"),
      "Select date and time"
    );
  });
});
