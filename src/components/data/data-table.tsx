"use client";

import { useState } from "react";
import type { QueryResult } from "@/lib/socrata/api-client";
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
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function DataTable({ result }: DataTableProps) {
  const { data, totalRows, executionTimeMs } = result;
  const defaultOpen = totalRows <= 10;
  const [open, setOpen] = useState(defaultOpen);

  if (data.length === 0) {
    return (
      <div className="py-3 text-xs text-muted-foreground">
        No data returned.
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
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
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

      {/* Table content */}
      {open && (
        <div className="overflow-x-auto px-1 pb-3">
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
      )}
    </div>
  );
}
