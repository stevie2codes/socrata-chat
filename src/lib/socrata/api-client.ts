// Low-level HTTP client for Socrata REST APIs.
// No AI SDK dependency — pure fetch-based with retry logic.

import { buildSodaApiUrl, buildPortalPermalink } from "@/lib/utils/soda-url";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class SocrataApiError extends Error {
  statusCode: number;
  errorCode: string;
  domain: string;
  datasetId?: string;

  constructor({
    message,
    statusCode,
    errorCode,
    domain,
    datasetId,
  }: {
    message: string;
    statusCode: number;
    errorCode: string;
    domain: string;
    datasetId?: string;
  }) {
    super(message);
    this.name = "SocrataApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.domain = domain;
    this.datasetId = datasetId;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogResult {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  rows: number;
  columns: number;
  category: string[];
  tags: string[];
  permalink: string;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  columns: {
    fieldName: string;
    name: string;
    dataType: string;
    description: string;
  }[];
  rowCount: number;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  owner: string;
  attribution: string;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  totalRows: number;
  query: string;
  executionTimeMs: number;
  provenance?: {
    domain: string;
    datasetId: string;
    sodaApiUrl: string;
    portalPermalink: string;
    queryTimestamp: string;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const RETRY_DELAY_MS = 1000;

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Fetch with automatic retry on 429 / 5xx (one retry after 1 s delay).
 * Reads SOCRATA_APP_TOKEN from process.env at call time so it can be set
 * after module load.
 */
async function fetchWithRetry(
  url: string,
  domain: string,
  datasetId?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = process.env.SOCRATA_APP_TOKEN;
  if (token) {
    headers["X-App-Token"] = token;
  }

  let response = await fetch(url, { headers });

  // Retry once on transient errors
  if (isRetryable(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    response = await fetch(url, { headers });
  }

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let message = `Socrata API error: ${response.status} ${response.statusText}`;

    try {
      const body = await response.json();
      errorCode = body.errorCode ?? body.code ?? errorCode;
      message = body.message ?? message;
    } catch {
      // Response body wasn't JSON — use defaults
    }

    throw new SocrataApiError({
      message,
      statusCode: response.status,
      errorCode,
      domain,
      datasetId,
    });
  }

  return response;
}

/**
 * Strip FROM clauses from SoQL so queries work with the resource endpoint
 * (which already implies the dataset). Append LIMIT if not present.
 */
function cleanSoQL(query: string, datasetId: string, limit: number): string {
  let cleaned = query;

  // Remove FROM clauses referencing this specific dataset (with optional backtick quoting)
  const escapedId = datasetId.replace(/[-]/g, "\\-");
  cleaned = cleaned.replace(
    new RegExp(`\\bFROM\\s+\`?${escapedId}\`?\\b`, "gi"),
    ""
  );

  // Remove FROM clauses referencing any other table name
  cleaned = cleaned.replace(/\bFROM\s+\w+[-\w]*\b/gi, "");

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Append LIMIT if not already present
  if (!/\bLIMIT\b/i.test(cleaned)) {
    cleaned += ` LIMIT ${limit}`;
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search the Socrata Discovery API catalog for datasets matching a query.
 * Results are filtered to only include datasets whose permalink contains the
 * requested domain, so cross-domain federated results are excluded.
 */
export async function searchCatalog({
  domain,
  query,
  limit = 10,
}: {
  domain: string;
  query: string;
  limit?: number;
}): Promise<CatalogResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    only: "datasets",
  });

  const url = `https://${domain}/api/catalog/v1?${params}`;
  const response = await fetchWithRetry(url, domain);
  const body = await response.json();

  const results: unknown[] = body.results ?? [];

  return results
    .map((item: unknown) => {
      const record = item as Record<string, unknown>;
      const resource = (record.resource ?? {}) as Record<string, unknown>;
      const classification = (record.classification ?? {}) as Record<
        string,
        unknown
      >;

      const rawDescription = String(resource.description ?? "");
      const description =
        rawDescription.length > 500
          ? rawDescription.slice(0, 500) + "..."
          : rawDescription;

      const columnsFieldName = resource.columns_field_name;
      const columnsCount = Array.isArray(columnsFieldName)
        ? columnsFieldName.length
        : 0;

      const categories = Array.isArray(classification.categories)
        ? (classification.categories as string[]).slice(0, 3)
        : [];
      const tags = Array.isArray(classification.tags)
        ? (classification.tags as string[]).slice(0, 5)
        : [];

      return {
        id: String(resource.id ?? ""),
        name: String(resource.name ?? ""),
        description,
        updatedAt: String(resource.updatedAt ?? ""),
        rows: (resource.rowsUpdatedAt as number) ?? 0,
        columns: columnsCount,
        category: categories,
        tags,
        permalink: String(record.permalink ?? ""),
      };
    })
    .filter((result) => result.permalink.includes(domain));
}

/**
 * Fetch full metadata for a specific dataset, including column schema.
 */
export async function getDatasetMetadata({
  domain,
  datasetId,
}: {
  domain: string;
  datasetId: string;
}): Promise<DatasetMetadata> {
  const url = `https://${domain}/api/views/${datasetId}.json`;
  const response = await fetchWithRetry(url, domain, datasetId);
  const body = (await response.json()) as Record<string, unknown>;

  const rawColumns = body.columns as Record<string, unknown>[] | undefined;
  const columns = Array.isArray(rawColumns)
    ? rawColumns.map((col) => ({
        fieldName: String(col.fieldName ?? ""),
        name: String(col.name ?? ""),
        dataType: String(col.dataTypeName ?? ""),
        description: String(col.description ?? ""),
      }))
    : [];

  const owner = body.owner as Record<string, unknown> | undefined;

  return {
    id: String(body.id ?? ""),
    name: String(body.name ?? ""),
    description: String(body.description ?? ""),
    columns,
    rowCount: (body.rowCount as number) ?? 0,
    createdAt: String(body.createdAt ?? ""),
    updatedAt: String(body.rowsUpdatedAt ?? ""),
    category: String(body.category ?? ""),
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    owner: owner ? String(owner.displayName ?? "") : "",
    attribution: String(body.attribution ?? ""),
  };
}

/**
 * Execute a SoQL query against a Socrata dataset.
 * The query is cleaned (FROM clauses stripped, LIMIT appended if missing)
 * before being sent to the SODA API.
 */
export async function queryDataset({
  domain,
  datasetId,
  query,
  limit = 100,
}: {
  domain: string;
  datasetId: string;
  query: string;
  limit?: number;
}): Promise<QueryResult> {
  const cleaned = cleanSoQL(query, datasetId, limit);

  const params = new URLSearchParams({ $query: cleaned });
  const url = `https://${domain}/resource/${datasetId}.json?${params}`;

  const start = performance.now();
  const response = await fetchWithRetry(url, domain, datasetId);
  const data = (await response.json()) as Record<string, unknown>[];
  const executionTimeMs = Math.round(performance.now() - start);

  return {
    data,
    totalRows: data.length,
    query: cleaned,
    executionTimeMs,
    provenance: {
      domain,
      datasetId,
      sodaApiUrl: buildSodaApiUrl(domain, datasetId, cleaned),
      portalPermalink: buildPortalPermalink(domain, datasetId),
      queryTimestamp: new Date().toISOString(),
    },
  };
}
