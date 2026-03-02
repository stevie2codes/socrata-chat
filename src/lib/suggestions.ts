const SUGGESTION_REGEX = /<!--\s*suggestions\s*-->([\s\S]*?)<!--\s*\/suggestions\s*-->/;

export function parseSuggestions(text: string): { cleanText: string; suggestions: string[] } {
  const match = text.match(SUGGESTION_REGEX);

  if (!match) {
    return { cleanText: text, suggestions: [] };
  }

  const suggestions = match[1]
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const cleanText = text.replace(SUGGESTION_REGEX, "").trim();

  return { cleanText, suggestions };
}

const TOOL_HEURISTICS: Record<string, string[]> = {
  search_datasets: ["Tell me more about the first result", "Search for something else"],
  query_dataset: ["Filter these results", "Group by a different column", "Compare with another dataset"],
  get_dataset_info: ["Query this dataset", "Search for different data"],
};

export function getHeuristicSuggestions(toolNames: string[]): string[] {
  // Use the last tool called for context
  const lastTool = toolNames[toolNames.length - 1];
  return TOOL_HEURISTICS[lastTool] ?? ["Ask another question"];
}
