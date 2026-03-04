"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOperatorsForType } from "@/lib/filter-operators";
import type { DatasetColumn, QueryFilter } from "@/types";

interface FilterEditorProps {
  filters: QueryFilter[];
  availableColumns: DatasetColumn[];
  onChange: (filters: QueryFilter[]) => void;
}

/** Build a human-readable label like "name equals 'Alice'" or "age > 30" */
export function buildLabel(
  column: string,
  operator: string,
  value: string
): string {
  if (!column || !operator || !value) return "";
  return `${column} ${operator} '${value}'`;
}

/** Map a Socrata dataType to an HTML input type */
export function getInputType(dataType: string): "text" | "number" | "date" {
  switch (dataType) {
    case "number":
      return "number";
    case "calendar_date":
      return "date";
    default:
      return "text";
  }
}

export function FilterEditor({
  filters,
  availableColumns,
  onChange,
}: FilterEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sortedColumns = [...availableColumns].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleRemoveFilter = (index: number) => {
    const next = filters.filter((_, i) => i !== index);
    onChange(next);
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && index < editingIndex) setEditingIndex(editingIndex - 1);
  };

  const handleAddFilter = () => {
    const newFilter: QueryFilter = {
      column: "",
      operator: "",
      value: "",
      label: "",
    };
    const next = [...filters, newFilter];
    onChange(next);
    setEditingIndex(next.length - 1);
  };

  const handleUpdateFilter = (
    index: number,
    patch: Partial<QueryFilter>
  ) => {
    const next = filters.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, ...patch };
      updated.label = buildLabel(updated.column, updated.operator, updated.value);
      return updated;
    });
    onChange(next);
  };

  const handleColumnChange = (index: number, fieldName: string) => {
    const col = availableColumns.find((c) => c.fieldName === fieldName);
    const operators = col ? getOperatorsForType(col.dataType) : [];
    const defaultOperator = operators.length > 0 ? operators[0].value : "";
    handleUpdateFilter(index, {
      column: fieldName,
      operator: defaultOperator,
      value: "",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingIndex(null);
    }
  };

  const getColumnDataType = (fieldName: string): string => {
    const col = availableColumns.find((c) => c.fieldName === fieldName);
    return col?.dataType ?? "text";
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      {filters.map((filter, index) => {
        if (editingIndex === index) {
          const dataType = getColumnDataType(filter.column);
          const operators = getOperatorsForType(dataType);
          const inputType = getInputType(dataType);

          return (
            <div
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2 py-1"
            >
              <Select
                value={filter.column || undefined}
                onValueChange={(val) => handleColumnChange(index, val)}
              >
                <SelectTrigger
                  className="h-7 min-w-[100px] border-white/[0.1] bg-transparent text-xs"
                  aria-label="Column"
                >
                  <SelectValue placeholder="Column..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedColumns.map((col) => (
                    <SelectItem key={col.fieldName} value={col.fieldName}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator || undefined}
                onValueChange={(val) =>
                  handleUpdateFilter(index, { operator: val })
                }
              >
                <SelectTrigger
                  className="h-7 min-w-[80px] border-white/[0.1] bg-transparent text-xs"
                  aria-label="Operator"
                >
                  <SelectValue placeholder="Op..." />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                type={inputType}
                value={filter.value}
                onChange={(e) =>
                  handleUpdateFilter(index, { value: e.target.value })
                }
                onKeyDown={handleKeyDown}
                placeholder="Value..."
                aria-label="Filter value"
                className="h-7 w-24 rounded-md border border-white/[0.1] bg-transparent px-2 text-xs text-foreground outline-none focus:border-primary/40"
              />

              <button
                onClick={() => handleRemoveFilter(index)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove filter ${index + 1}`}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        }

        return (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer gap-1 font-mono text-[10px] font-normal"
          >
            <span
              onClick={() => setEditingIndex(index)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setEditingIndex(index);
              }}
            >
              {filter.label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFilter(index);
              }}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove filter ${index + 1}`}
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        );
      })}

      <button
        onClick={handleAddFilter}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        aria-label="Add filter"
      >
        <Plus className="size-3" aria-hidden="true" />
        Add filter
      </button>
    </div>
  );
}
