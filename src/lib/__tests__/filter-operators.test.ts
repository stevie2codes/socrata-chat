import { describe, it, expect } from "vitest";
import { getOperatorsForType, OPERATORS_BY_TYPE } from "../filter-operators";

describe("getOperatorsForType", () => {
  it("returns text operators for 'text' type", () => {
    const ops = getOperatorsForType("text");
    expect(ops.map((o) => o.value)).toEqual(["=", "!=", "LIKE"]);
  });

  it("returns number operators for 'number' type", () => {
    const ops = getOperatorsForType("number");
    expect(ops.map((o) => o.value)).toEqual(["=", "!=", ">", "<", ">=", "<="]);
  });

  it("returns date operators for 'calendar_date' type", () => {
    const ops = getOperatorsForType("calendar_date");
    expect(ops.map((o) => o.value)).toEqual(["=", ">", "<", ">=", "<="]);
  });

  it("falls back to text operators for unknown types", () => {
    const ops = getOperatorsForType("blob");
    expect(ops).toEqual(OPERATORS_BY_TYPE.text);
  });
});
