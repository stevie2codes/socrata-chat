"use client";

import { useState, useMemo, useId } from "react";
import { Download } from "lucide-react";
import type { QueryResult } from "@/lib/socrata/api-client";
import { downloadCsv } from "@/lib/utils/csv-export";
import { isChartable, detectChartConfig } from "@/lib/utils/chart-utils";
import { BarChartView } from "@/components/data/bar-chart-view";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface DataTableProps {
  result: QueryResult;
  /** Force table collapsed on mount (used for older messages in thread) */
  defaultCollapsed?: boolean;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

type ViewMode = "table" | "chart";

export function DataTable({ result, defaultCollapsed }: DataTableProps) {
  const { data, totalRows, executionTimeMs } = result;
  const defaultOpen = defaultCollapsed ? false : totalRows <= 10;
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState<ViewMode>("table");
  const contentId = useId();

  const chartConfig = useMemo(
    () => (isChartable(data) ? detectChartConfig(data) : null),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="my-3 rounded-lg border-l-2 border-muted-foreground/30 px-3 py-3">
        <p className="text-xs text-muted-foreground">
          No data returned. The query may have matched zero rows — try broadening
          your filters or checking column names.
        </p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div
      className="my-3 rounded-lg border-l-2"
      style={{ borderColor: "var(--data-1)", opacity: 0.95 }}
    >
      {/* Metadata bar */}
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {totalRows.toLocaleString()} {totalRows === 1 ? "row" : "rows"} &middot; {executionTimeMs}ms
        </span>

        {/* View switcher — only when chartable */}
        {chartConfig && (
          <div role="tablist" className="flex gap-0.5 rounded-md glass-pill p-0.5">
            <button
              role="tab"
              type="button"
              aria-selected={view === "table"}
              onClick={() => setView("table")}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                view === "table"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Table
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={view === "chart"}
              onClick={() => { setView("chart"); setOpen(true); }}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                view === "chart"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bar Chart
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => downloadCsv(data)}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Export CSV"
        >
          <Download className="size-3" />
          Export CSV
        </button>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center gap-2 px-3 pb-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Hide data" : "Show data"}
      </button>

      {/* Content */}
      {open && view === "chart" && chartConfig ? (
        <div id={contentId} className="px-1 pb-3">
          <BarChartView data={data} config={chartConfig} />
        </div>
      ) : open ? (
        <div id={contentId} className="overflow-x-auto px-1 pb-3">
          <Table>
            <TableHeader className="glass-subtle">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="text-xs">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="max-w-[200px] truncate font-mono text-xs"
                      title={formatCellValue(row[col])}
                    >
                      {formatCellValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {/* Row limit note */}
      {data.length >= 100 && (
        <p className="px-3 pb-2 text-[10px] text-muted-foreground">
          Showing first {data.length.toLocaleString()} rows. Try adding aggregations (GROUP BY, COUNT) to summarize larger datasets.
        </p>
      )}
    </div>
  );
}
