/** Build a direct SODA API URL for independent verification of query results. */
export function buildSodaApiUrl(domain: string, datasetId: string, soql: string): string {
  const params = new URLSearchParams({ $query: soql });
  return `https://${domain}/resource/${datasetId}.json?${params}`;
}

/** Build a link to the dataset's page on the Socrata portal. */
export function buildPortalPermalink(domain: string, datasetId: string): string {
  return `https://${domain}/d/${datasetId}`;
}
