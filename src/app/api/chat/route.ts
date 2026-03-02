import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getTools } from "@/lib/socrata/tool-provider";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import type { SocrataDataset, QueryFilter } from "@/types";

export const maxDuration = 60;

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
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
