import { buildSodaApiUrl, buildPortalPermalink } from "@/lib/utils/soda-url";

describe("buildSodaApiUrl", () => {
  it("builds a valid SODA API URL", () => {
    const url = buildSodaApiUrl(
      "data.cityofchicago.org",
      "4ijn-s7e5",
      "SELECT * WHERE results = 'Fail' LIMIT 100"
    );
    // URLSearchParams encodes $ as %24 — that's fine, SODA API accepts it
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://data.cityofchicago.org");
    expect(parsed.pathname).toBe("/resource/4ijn-s7e5.json");
    expect(parsed.searchParams.get("$query")).toBe("SELECT * WHERE results = 'Fail' LIMIT 100");
  });

  it("handles special characters in SoQL", () => {
    const url = buildSodaApiUrl(
      "data.cityofchicago.org",
      "4ijn-s7e5",
      "SELECT count(*) WHERE name LIKE '%test%'"
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("$query")).toBe("SELECT count(*) WHERE name LIKE '%test%'");
  });
});

describe("buildPortalPermalink", () => {
  it("builds a portal dataset permalink", () => {
    const url = buildPortalPermalink("data.cityofchicago.org", "4ijn-s7e5");
    expect(url).toBe("https://data.cityofchicago.org/d/4ijn-s7e5");
  });
});
