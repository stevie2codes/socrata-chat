import { render, screen } from "@testing-library/react";
import { ProvenanceFooter } from "@/components/data/provenance-footer";

const provenance = {
  domain: "data.cityofchicago.org",
  datasetId: "4ijn-s7e5",
  sodaApiUrl: "https://data.cityofchicago.org/resource/4ijn-s7e5.json?$query=SELECT%20*",
  portalPermalink: "https://data.cityofchicago.org/d/4ijn-s7e5",
  queryTimestamp: "2026-03-04T12:00:00.000Z",
};

describe("ProvenanceFooter", () => {
  it("renders the portal domain as a link", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    const link = screen.getByRole("link", { name: /data\.cityofchicago\.org/i });
    expect(link).toHaveAttribute("href", provenance.portalPermalink);
  });

  it("renders the dataset ID", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    expect(screen.getByText(/4ijn-s7e5/)).toBeInTheDocument();
  });

  it("renders the query timestamp", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    // Should show some formatted time
    expect(screen.getByText(/queried/i)).toBeInTheDocument();
  });

  it("shows a limit warning when limitApplied is true", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={100} limitApplied={true} />);
    expect(screen.getByText(/results may be partial/i)).toBeInTheDocument();
  });

  it("does not show limit warning when limitApplied is false", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    expect(screen.queryByText(/results may be partial/i)).not.toBeInTheDocument();
  });

  it("renders the SODA API verification link", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    const link = screen.getByRole("link", { name: /verify/i });
    expect(link).toHaveAttribute("href", provenance.sodaApiUrl);
  });
});
