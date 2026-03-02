// Factory that returns either the direct TypeScript tools or the MCP tools
// depending on the USE_MCP environment variable.
//
// USE_MCP=false (default) → socrataTools from tools.ts (3 tools)
// USE_MCP=true            → MCP tools from Python server (5 tools)
// Falls back to TypeScript tools if MCP connection fails.

import { socrataTools } from "@/lib/socrata/tools";
import { getMCPTools } from "@/lib/socrata/mcp-client";

export async function getTools() {
  if (process.env.USE_MCP === "true") {
    try {
      return await getMCPTools();
    } catch (error) {
      console.warn(
        "[tool-provider] MCP connection failed, falling back to TypeScript tools:",
        error instanceof Error ? error.message : String(error)
      );
      return socrataTools;
    }
  }
  return socrataTools;
}
