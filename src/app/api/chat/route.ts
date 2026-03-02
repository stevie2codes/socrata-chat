import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    portal = "data.cityofchicago.org",
  }: { messages: UIMessage[]; portal?: string } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a friendly data exploration assistant for public open data portals. You are currently connected to the ${portal} Socrata portal.

You help users discover and query public datasets using natural language.

For now, respond conversationally. In future updates, you'll have access to tools for searching and querying Socrata datasets directly.

Keep responses concise and helpful. When users ask about data, describe what kinds of datasets might be available and how you'll be able to help them explore it.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
