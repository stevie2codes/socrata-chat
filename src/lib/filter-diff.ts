import type { QueryFilter } from "@/types";

function filterKey(f: QueryFilter): string {
  return `${f.column}|${f.operator}|${f.value}`;
}

export function composeFilterMessage(
  original: QueryFilter[],
  current: QueryFilter[]
): string {
  // No changes
  if (
    original.length === current.length &&
    original.every((f, i) => filterKey(f) === filterKey(current[i]))
  ) {
    return "Go ahead, run it";
  }

  // All removed
  if (current.length === 0) {
    return "Remove all filters and run the query.";
  }

  const parts: string[] = [];
  const origByCol = new Map(original.map((f) => [f.column, f]));
  const currByCol = new Map(current.map((f) => [f.column, f]));

  // Changed filters (same column, different operator/value)
  for (const [col, curr] of currByCol) {
    const orig = origByCol.get(col);
    if (orig && filterKey(orig) !== filterKey(curr)) {
      parts.push(`Change ${col} filter to ${curr.label}`);
    }
  }

  // Added filters (column not in original)
  for (const f of current) {
    if (!origByCol.has(f.column)) {
      parts.push(`Add filter: ${f.label}`);
    }
  }

  // Removed filters (column not in current)
  for (const f of original) {
    if (!currByCol.has(f.column)) {
      parts.push(`Remove filter: ${f.label}`);
    }
  }

  if (parts.length === 0) {
    return "Go ahead, run it";
  }

  return `Run the query with these changes: ${parts.join(". ")}.`;
}
