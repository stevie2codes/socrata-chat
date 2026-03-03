export interface ChartConfig {
  categoryKey: string;
  valueKey: string;
  valueLabel: string;
}

/**
 * Returns true when data has enough structure for a meaningful bar chart:
 * 2+ rows, ≤5 columns, and at least one numeric column.
 */
export function isChartable(data: Record<string, unknown>[]): boolean {
  if (data.length < 2) return false;
  const columns = Object.keys(data[0]);
  if (columns.length > 5) return false;

  return columns.some((col) => {
    const val = data[0][col];
    return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "");
  });
}

/**
 * Picks the best category (string) and value (numeric) columns for a bar chart.
 */
export function detectChartConfig(
  data: Record<string, unknown>[]
): ChartConfig | null {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const numericCols: string[] = [];
  const stringCols: string[] = [];

  for (const col of columns) {
    // Sample a few rows to determine type
    const isNumeric = data.slice(0, 5).every((row) => {
      const v = row[col];
      if (v === null || v === undefined) return true;
      if (typeof v === "number") return true;
      return typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "";
    });

    if (isNumeric) {
      numericCols.push(col);
    } else {
      stringCols.push(col);
    }
  }

  if (numericCols.length === 0) return null;

  const categoryKey = stringCols[0] ?? columns[0];
  const valueKey =
    numericCols.find((c) => c !== categoryKey) ?? numericCols[0];
  const valueLabel = valueKey.replace(/_/g, " ");

  return { categoryKey, valueKey, valueLabel };
}
