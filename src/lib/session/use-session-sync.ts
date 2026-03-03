"use client";

import { useEffect, useRef, type Dispatch } from "react";
import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import type { SessionAction } from "@/lib/session/session-context";
import type { DatasetMetadata } from "@/lib/socrata/api-client";
import type { SocrataDataset } from "@/types";

function mapMetadataToDataset(
  meta: DatasetMetadata,
  domain: string
): SocrataDataset {
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    domain,
    columns: meta.columns.map((col) => ({
      fieldName: col.fieldName,
      name: col.name,
      dataType: col.dataType,
      description: col.description,
    })),
    rowCount: meta.rowCount,
    updatedAt: meta.updatedAt,
    category: meta.category,
    tags: meta.tags,
  };
}

/**
 * Scans assistant messages for completed tool calls and syncs session state.
 * When `get_dataset_info` completes, dispatches SET_DATASET so the system
 * prompt includes schema context on subsequent turns.
 */
export function useSessionSync(
  messages: UIMessage[],
  dispatch: Dispatch<SessionAction>,
  portal: string
) {
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        if (part.state !== "output-available") continue;

        const partId = `${message.id}-${getToolName(part)}-${part.toolCallId}`;
        if (processedRef.current.has(partId)) continue;
        processedRef.current.add(partId);

        const toolName = getToolName(part);
        if (toolName === "get_dataset_info") {
          const output = (part as Record<string, unknown>).output;
          if (output && typeof output === "object" && "id" in output) {
            const dataset = mapMetadataToDataset(
              output as DatasetMetadata,
              portal
            );
            dispatch({ type: "SET_DATASET", payload: dataset });
          }
        }
      }
    }
  }, [messages, dispatch, portal]);
}
