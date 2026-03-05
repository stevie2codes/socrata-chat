"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";
import type { QueryConfirmation, QueryFilter } from "@/types";
import { DatasetCardList } from "@/components/data/dataset-card-list";
import { DataTable } from "@/components/data/data-table";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";
import { ProvenanceFooter } from "@/components/data/provenance-footer";

interface ToolResultRendererProps {
  toolName: string;
  toolCallId?: string;
  output: unknown;
  onConfirmRun?: (args: { toolCallId: string; filters: { original: QueryFilter[]; current: QueryFilter[] } }) => void;
  onConfirmAdjust?: (args: { toolCallId: string }) => void;
}

function isCatalogResults(output: unknown): output is CatalogResult[] {
  return (
    Array.isArray(output) &&
    output.length > 0 &&
    typeof output[0] === "object" &&
    output[0] !== null &&
    "permalink" in output[0]
  );
}

function isQueryResult(output: unknown): output is QueryResult {
  return (
    typeof output === "object" &&
    output !== null &&
    "data" in output &&
    Array.isArray((output as Record<string, unknown>).data)
  );
}

function isQueryConfirmation(output: unknown): output is QueryConfirmation {
  return (
    typeof output === "object" &&
    output !== null &&
    "soql" in output &&
    "dataset" in output &&
    "estimatedDescription" in output
  );
}

export function ToolResultRenderer({
  toolName,
  toolCallId,
  output,
  onConfirmRun,
  onConfirmAdjust,
}: ToolResultRendererProps) {
  if (toolName === "search_datasets" && isCatalogResults(output)) {
    return <DatasetCardList datasets={output} />;
  }

  if (toolName === "confirm_query" && isQueryConfirmation(output)) {
    return (
      <QueryConfirmationCard
        confirmation={output}
        toolCallId={toolCallId}
        onRun={(filters) => toolCallId && onConfirmRun?.({ toolCallId, filters })}
        onAdjust={() => toolCallId && onConfirmAdjust?.({ toolCallId })}
      />
    );
  }

  if (toolName === "query_dataset" && isQueryResult(output)) {
    const limitApplied = output.data.length >= 100 && !output.query.match(/LIMIT\s+\d+/i);
    return (
      <>
        <DataTable result={output} />
        {output.provenance && (
          <ProvenanceFooter
            provenance={output.provenance}
            totalRows={output.totalRows}
            limitApplied={limitApplied}
          />
        )}
      </>
    );
  }

  return null;
}
