function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(
  data: Record<string, unknown>[],
  filename = "export.csv"
) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const headerRow = columns.map(escapeCsvField).join(",");
  const dataRows = data.map((row) =>
    columns.map((col) => escapeCsvField(row[col])).join(",")
  );
  const csv = [headerRow, ...dataRows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
