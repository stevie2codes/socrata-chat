import type { QueryFilter } from "@/types";

function filterKey(f: QueryFilter): string {
  return `${f.column}|${f.operator}|${f.value}`;
}

export function composeFilterMessage(
  original: QueryFilter[],
  current: QueryFilter[]
): string {
  // No changes — same length and same keys in order
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

  const origKeys = new Set(original.map(filterKey));
  const currKeys = new Set(current.map(filterKey));

  const parts: string[] = [];

  // Added filters (in current but not in original)
  for (const f of current) {
    if (!origKeys.has(filterKey(f))) {
      parts.push(`Add filter: ${f.label}`);
    }
  }

  // Removed filters (in original but not in current)
  for (const f of original) {
    if (!currKeys.has(filterKey(f))) {
      parts.push(`Remove filter: ${f.label}`);
    }
  }

  if (parts.length === 0) {
    return "Go ahead, run it";
  }

  return `Run the query with these changes: ${parts.join(". ")}.`;
}
