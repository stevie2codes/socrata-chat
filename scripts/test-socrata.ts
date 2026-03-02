/**
 * Integration test script for the Socrata API client.
 * Exercises searchCatalog, getDatasetMetadata, and queryDataset against live APIs.
 *
 * Run with: npx tsx scripts/test-socrata.ts
 *
 * No API key required — Socrata APIs are public.
 */

import {
  searchCatalog,
  getDatasetMetadata,
  queryDataset,
  SocrataApiError,
} from "../src/lib/socrata/api-client";

const DOMAIN = "data.cityofchicago.org";
// Chicago food inspections dataset (well-known, stable)
const KNOWN_DATASET_ID = "4ijn-s7e5";

async function testSearchCatalog() {
  console.log("\n--- searchCatalog ---");
  const results = await searchCatalog({
    domain: DOMAIN,
    query: "food inspections",
    limit: 5,
  });
  console.log(`Found ${results.length} results`);
  for (const r of results) {
    console.log(`  [${r.id}] ${r.name} (${r.rows} rows, ${r.columns} cols)`);
  }
  if (results.length === 0) {
    throw new Error("Expected at least 1 search result");
  }
  console.log("PASS");
}

async function testGetDatasetMetadata() {
  console.log("\n--- getDatasetMetadata ---");
  const meta = await getDatasetMetadata({
    domain: DOMAIN,
    datasetId: KNOWN_DATASET_ID,
  });
  console.log(`Dataset: ${meta.name}`);
  console.log(`Rows: ${meta.rowCount}`);
  console.log(`Columns: ${meta.columns.length}`);
  for (const col of meta.columns.slice(0, 5)) {
    console.log(`  ${col.fieldName} (${col.dataType}): ${col.name}`);
  }
  if (!meta.name || meta.columns.length === 0) {
    throw new Error("Expected non-empty metadata");
  }
  console.log("PASS");
}

async function testQueryDataset() {
  console.log("\n--- queryDataset ---");
  const result = await queryDataset({
    domain: DOMAIN,
    datasetId: KNOWN_DATASET_ID,
    query: "SELECT results, COUNT(*) AS total GROUP BY results ORDER BY total DESC",
    limit: 10,
  });
  console.log(`Query: ${result.query}`);
  console.log(`Rows returned: ${result.totalRows}`);
  console.log(`Execution time: ${result.executionTimeMs}ms`);
  for (const row of result.data.slice(0, 5)) {
    console.log(`  ${JSON.stringify(row)}`);
  }
  if (result.totalRows === 0) {
    throw new Error("Expected at least 1 row");
  }
  console.log("PASS");
}

async function testErrorHandling() {
  console.log("\n--- Error handling (bad dataset ID) ---");
  try {
    await getDatasetMetadata({
      domain: DOMAIN,
      datasetId: "xxxx-xxxx",
    });
    throw new Error("Expected SocrataApiError");
  } catch (err) {
    if (err instanceof SocrataApiError) {
      console.log(`Got expected error: ${err.statusCode} ${err.message}`);
      console.log("PASS");
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log("Socrata API Client Integration Tests");
  console.log(`Domain: ${DOMAIN}`);

  await testSearchCatalog();
  await testGetDatasetMetadata();
  await testQueryDataset();
  await testErrorHandling();

  console.log("\n=== All tests passed ===");
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
