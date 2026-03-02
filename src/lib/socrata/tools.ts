// AI SDK tool definitions for Socrata API integration.
// These tools are passed to streamText() so Claude can search, inspect, and
// query open-data portals on the user's behalf.
//
// Tool names (search_datasets, get_dataset_info, query_dataset) intentionally
// mirror the MCP server so either backend can be swapped transparently.

import { tool } from "ai";
import { z } from "zod";

import {
  searchCatalog,
  getDatasetMetadata,
  queryDataset,
  SocrataApiError,
} from "@/lib/socrata/api-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a structured error object from a SocrataApiError so the model can
 *  read the failure reason and self-correct (e.g. fix a bad dataset ID or
 *  SoQL syntax error). */
function toToolError(err: SocrataApiError) {
  return {
    error: err.message,
    errorCode: err.errorCode,
    statusCode: err.statusCode,
    domain: err.domain,
    ...(err.datasetId ? { datasetId: err.datasetId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const search_datasets = tool({
  description:
    "Search a Socrata open-data portal's catalog for datasets matching a keyword query. " +
    "Use this tool when the user asks about available data, wants to find datasets on a " +
    "topic, or when you need to discover dataset IDs before querying. " +
    "Results include dataset name, description, row count, column count, and a permalink.",
  inputSchema: z.object({
    domain: z
      .string()
      .describe(
        'Socrata portal hostname, e.g. "data.cityofchicago.org". Do not include the protocol.'
      ),
    query: z
      .string()
      .describe(
        "Search keywords or phrase to match against dataset names and descriptions."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Maximum number of results to return (1-50). Defaults to 10."),
  }),
  execute: async ({ domain, query, limit }) => {
    try {
      return await searchCatalog({ domain, query, limit });
    } catch (err) {
      if (err instanceof SocrataApiError) {
        return toToolError(err);
      }
      throw err;
    }
  },
});

const get_dataset_info = tool({
  description:
    "Retrieve full metadata and column schema for a specific Socrata dataset. " +
    "Always call this before querying an unknown dataset so you know the column " +
    "names, data types, row count, and description. The response includes every " +
    "column's fieldName, display name, data type, and description.",
  inputSchema: z.object({
    domain: z
      .string()
      .describe(
        'Socrata portal hostname, e.g. "data.cityofchicago.org". Do not include the protocol.'
      ),
    datasetId: z
      .string()
      .regex(/^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/)
      .describe(
        'Dataset identifier in Socrata 4x4 format, e.g. "ijzp-q8t2".'
      ),
  }),
  execute: async ({ domain, datasetId }) => {
    try {
      return await getDatasetMetadata({ domain, datasetId });
    } catch (err) {
      if (err instanceof SocrataApiError) {
        return toToolError(err);
      }
      throw err;
    }
  },
});

const query_dataset = tool({
  description:
    "Execute a SoQL (Socrata Query Language) query against a dataset and return the " +
    "matching rows. SoQL is similar to SQL. Write standard SELECT, WHERE, GROUP BY, " +
    "ORDER BY, and aggregate functions (COUNT, SUM, AVG, MIN, MAX). " +
    "IMPORTANT: Do NOT include a FROM clause — the dataset is implicit from the " +
    "datasetId parameter. A LIMIT clause is appended automatically if omitted. " +
    "Example query: SELECT primary_type, COUNT(*) AS total GROUP BY primary_type ORDER BY total DESC",
  inputSchema: z.object({
    domain: z
      .string()
      .describe(
        'Socrata portal hostname, e.g. "data.cityofchicago.org". Do not include the protocol.'
      ),
    datasetId: z
      .string()
      .regex(/^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/)
      .describe(
        'Dataset identifier in Socrata 4x4 format, e.g. "ijzp-q8t2".'
      ),
    query: z
      .string()
      .describe(
        "SoQL query string. Do NOT include a FROM clause. Example: " +
          '"SELECT location, date WHERE date > \'2024-01-01\' ORDER BY date DESC"'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50000)
      .optional()
      .default(100)
      .describe(
        "Maximum rows to return (1-50000). Defaults to 100. Only applied if the query has no LIMIT clause."
      ),
  }),
  execute: async ({ domain, datasetId, query, limit }) => {
    try {
      return await queryDataset({ domain, datasetId, query, limit });
    } catch (err) {
      if (err instanceof SocrataApiError) {
        return toToolError(err);
      }
      throw err;
    }
  },
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Tool record for use with AI SDK's `streamText({ tools: socrataTools })`. */
export const socrataTools = {
  search_datasets,
  get_dataset_info,
  query_dataset,
} as const;
