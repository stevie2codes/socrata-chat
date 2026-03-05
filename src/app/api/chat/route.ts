import {
  convertToModelMessages,
  isToolUIPart,
  getToolName,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getTools } from "@/lib/socrata/tool-provider";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import type { SocrataDataset, QueryFilter } from "@/types";

export const maxDuration = 120;

/**
 * Trim bulky tool results (query_dataset row data) from message history
 * before sending to the model. The full data stays client-side for rendering;
 * Claude only needs a summary to reason about follow-up questions.
 */
function trimToolResults(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    if (msg.role !== "assistant") return msg;

    const hasBulkyPart = msg.parts.some((p) => {
      if (!isToolUIPart(p) || getToolName(p) !== "query_dataset") return false;
      if (p.state !== "output-available") return false;
      const output = (p as Record<string, unknown>).output as Record<string, unknown> | undefined;
      return output?.data && Array.isArray(output.data) && output.data.length > 3;
    });
    if (!hasBulkyPart) return msg;

    return {
      ...msg,
      parts: msg.parts.map((p) => {
        if (!isToolUIPart(p) || getToolName(p) !== "query_dataset") return p;
        if (p.state !== "output-available") return p;
        const output = (p as Record<string, unknown>).output as Record<string, unknown> | undefined;
        if (!output?.data || !Array.isArray(output.data) || output.data.length <= 3) return p;

        return {
          ...p,
          output: {
            ...output,
            data: (output.data as unknown[]).slice(0, 3),
            _trimmed: true,
            _originalRowCount: output.data.length,
          },
        };
      }),
    };
  });
}

export async function POST(req: Request) {
  const {
    messages,
    portal = "data.cityofchicago.org",
    activeDataset = null,
    filters = [],
  }: {
    messages: UIMessage[];
    portal?: string;
    activeDataset?: SocrataDataset | null;
    filters?: QueryFilter[];
  } = await req.json();

  const tools = await getTools();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: buildSystemPrompt({ portal, activeDataset, filters }),
    messages: await convertToModelMessages(trimToolResults(messages)),
    tools,
    maxOutputTokens: 4096,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
