// Lazy singleton MCP client that connects to the Socrata Python MCP server
// over stdio. Only instantiated when USE_MCP=true and getMCPTools() is called.
//
// The Python server is spawned with:
//   python -m socrata_mcp.server
// in the directory specified by the SOCRATA_MCP_PATH env var.

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let mcpClient: MCPClient | null = null;
let clientPromise: Promise<MCPClient> | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getMCPPath(): string {
  const mcpPath = process.env.SOCRATA_MCP_PATH;
  if (!mcpPath) {
    throw new Error(
      "SOCRATA_MCP_PATH environment variable is not set. " +
        "It should point to the directory containing the Socrata MCP Python server."
    );
  }
  return mcpPath;
}

/** Reset singleton state so the next getMCPTools() call creates a fresh client. */
function resetClient(): void {
  mcpClient = null;
  clientPromise = null;
}

async function initClient(): Promise<MCPClient> {
  const cwd = getMCPPath();

  const transport = new Experimental_StdioMCPTransport({
    command: "python",
    args: ["-m", "socrata_mcp.server"],
    cwd,
    stderr: "pipe",
  });

  const client = await createMCPClient({
    transport,
    name: "socrata-chat-mcp-client",
    onUncaughtError: (error: unknown) => {
      console.error("[MCP] Uncaught error, resetting client:", error);
      // Reset so the next request will re-create the client
      resetClient();
    },
  });

  mcpClient = client;
  return client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the MCP tool set from the Socrata Python MCP server.
 * Creates the client lazily on first call. Subsequent calls reuse the
 * existing connection unless it was reset due to an error.
 *
 * The returned tools are compatible with `streamText({ tools })`.
 */
export async function getMCPTools() {
  if (!mcpClient) {
    // Deduplicate concurrent initialization calls
    if (!clientPromise) {
      clientPromise = initClient();
    }
    try {
      mcpClient = await clientPromise;
    } catch (error) {
      // If init fails, reset so next call tries again
      resetClient();
      throw new Error(
        `Failed to connect to Socrata MCP server: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return mcpClient.tools();
}

/**
 * Close the MCP client and release resources.
 * Safe to call even if the client was never initialized.
 */
export async function closeMCPClient(): Promise<void> {
  const pending = clientPromise;
  const client = mcpClient;
  resetClient();
  if (client) {
    await client.close();
  } else if (pending) {
    try {
      const resolvedClient = await pending;
      await resolvedClient.close();
    } catch {
      // Init failed — nothing to close
    }
  }
}
