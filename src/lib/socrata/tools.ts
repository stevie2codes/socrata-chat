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

const confirm_query = tool({
  description:
    "Present a query plan to the user for confirmation before executing. " +
    "Call this BEFORE query_dataset when this is the first query in the conversation " +
    "or when switching to a different dataset. Skip this tool for follow-up " +
    "refinements on the same dataset. The tool returns the plan for the UI to render " +
    "as an interactive confirmation card. " +
    "IMPORTANT: filters must be structured objects with column, operator, value, and label. " +
    "availableColumns should include all columns from the dataset schema (from get_dataset_info). " +
    "Always include a methodology explaining your interpretation of the user's question.",
  inputSchema: z.object({
    dataset: z.object({
      name: z.string().describe("Human-readable dataset name"),
      id: z.string().describe("Socrata 4x4 dataset ID"),
      domain: z.string().describe("Portal hostname"),
      rowCount: z.number().describe("Total rows in the dataset"),
    }),
    soql: z
      .string()
      .describe("The SoQL query you intend to execute"),
    filters: z
      .array(
        z.object({
          column: z.string().describe("fieldName from the dataset schema"),
          operator: z.string().describe('SoQL operator: "=", "!=", ">", "<", ">=", "<=", or "LIKE"'),
          value: z.string().describe("The literal filter value"),
          label: z.string().describe('Human-readable label, e.g. "results = \'Fail\'"'),
        })
      )
      .describe("Structured filters applied to this query"),
    columns: z
      .array(z.string())
      .describe("Column names that will be returned by the query"),
    estimatedDescription: z
      .string()
      .describe("One-sentence plain-English summary of what this query does"),
    availableColumns: z
      .array(
        z.object({
          fieldName: z.string().describe("API field name"),
          name: z.string().describe("Human-readable column name"),
          dataType: z.string().describe('Socrata data type: "text", "number", "calendar_date", etc.'),
          description: z.string().optional().describe("Column description if available"),
        })
      )
      .describe("All columns from the dataset schema, for the filter editor dropdowns"),
    methodology: z
      .string()
      .describe(
        "1-2 sentence plain-English explanation of how you interpreted the user's question " +
        "and what this query measures. Example: 'Counting rows where inspection result is Fail, " +
        "grouped by month using the inspection_date column.'"
      ),
    technicalNotes: z
      .object({
        columnMappings: z
          .array(
            z.object({
              intent: z.string().describe('What this column represents in the query, e.g. "inspection date"'),
              fieldName: z.string().describe("The dataset fieldName used"),
              rationale: z.string().describe("Why this column was chosen over alternatives"),
            })
          )
          .describe("Key columns used and why they were selected"),
        assumptions: z
          .array(z.string())
          .describe(
            'Assumptions made about the query, e.g. "No date range specified — querying all available data"'
          ),
        exclusions: z
          .array(z.string())
          .describe(
            'Data excluded by this query, e.g. "Rows with null results are excluded by the WHERE clause"'
          ),
      })
      .optional()
      .describe("Technical details for power users — column choices, assumptions, and exclusions"),
  }),
  execute: async (input) => input,
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Tool record for use with AI SDK's `streamText({ tools: socrataTools })`. */
export const socrataTools = {
  search_datasets,
  get_dataset_info,
  confirm_query,
  query_dataset,
} as const;
