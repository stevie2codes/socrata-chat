import { describe, it, expect } from "vitest";
import { composeFilterMessage } from "../filter-diff";
import type { QueryFilter } from "@/types";

describe("composeFilterMessage", () => {
  const base: QueryFilter[] = [
    { column: "results", operator: "=", value: "Fail", label: "results = 'Fail'" },
    { column: "date", operator: ">=", value: "2025-01-01", label: "date >= '2025-01-01'" },
  ];

  it("returns 'Go ahead, run it' when no changes", () => {
    expect(composeFilterMessage(base, [...base])).toBe("Go ahead, run it");
  });

  it("describes added filters", () => {
    const current = [
      ...base,
      { column: "ward", operator: "=", value: "44", label: "ward = '44'" },
    ];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("ward = '44'");
    expect(msg).toContain("Add");
  });

  it("describes removed filters", () => {
    const current = [base[0]];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("date >= '2025-01-01'");
    expect(msg).toContain("Remove");
  });

  it("describes changed values as remove + add", () => {
    const current = [
      { ...base[0], value: "Pass", label: "results = 'Pass'" },
      base[1],
    ];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("results = 'Pass'");
    expect(msg).toContain("Add");
    expect(msg).toContain("Remove");
  });

  it("handles all filters removed", () => {
    const msg = composeFilterMessage(base, []);
    expect(msg).toContain("Remove all filters");
  });

  it("handles duplicate-column filters (date range)", () => {
    const rangeOriginal: QueryFilter[] = [
      { column: "date", operator: ">=", value: "2025-01-01", label: "date >= '2025-01-01'" },
      { column: "date", operator: "<=", value: "2025-12-31", label: "date <= '2025-12-31'" },
    ];
    // No changes
    expect(composeFilterMessage(rangeOriginal, [...rangeOriginal])).toBe("Go ahead, run it");

    // Change one bound
    const updated = [
      rangeOriginal[0],
      { column: "date", operator: "<=", value: "2025-06-30", label: "date <= '2025-06-30'" },
    ];
    const msg = composeFilterMessage(rangeOriginal, updated);
    expect(msg).toContain("date <= '2025-06-30'");
    expect(msg).toContain("date <= '2025-12-31'");
  });
});
