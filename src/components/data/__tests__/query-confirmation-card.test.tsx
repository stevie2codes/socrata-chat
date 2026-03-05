import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";
import type { QueryConfirmation } from "@/types";

const baseConfirmation: QueryConfirmation = {
  dataset: { name: "Food Inspections", id: "4ijn-s7e5", domain: "data.cityofchicago.org", rowCount: 234000 },
  soql: "SELECT * WHERE results = 'Fail' ORDER BY date DESC LIMIT 100",
  filters: [{ column: "results", operator: "=", value: "Fail", label: "results = 'Fail'" }],
  columns: ["dba_name", "results", "inspection_date"],
  estimatedDescription: "Show all failed food inspections",
  availableColumns: [
    { fieldName: "dba_name", name: "DBA Name", dataType: "text" },
    { fieldName: "results", name: "Results", dataType: "text" },
    { fieldName: "inspection_date", name: "Inspection Date", dataType: "calendar_date" },
  ],
};

const noop = () => {};

describe("QueryConfirmationCard methodology", () => {
  it("renders methodology text when provided", () => {
    const confirmation: QueryConfirmation = {
      ...baseConfirmation,
      methodology: "Counting failed inspections filtered by results column.",
    };
    render(<QueryConfirmationCard confirmation={confirmation} onRun={noop} onAdjust={noop} />);
    expect(screen.getByText(/Counting failed inspections/)).toBeInTheDocument();
  });

  it("does not render methodology section when not provided", () => {
    render(<QueryConfirmationCard confirmation={baseConfirmation} onRun={noop} onAdjust={noop} />);
    expect(screen.queryByText(/Methodology/i)).not.toBeInTheDocument();
  });

  it("renders technical details toggle when technicalNotes provided", async () => {
    const user = userEvent.setup();
    const confirmation: QueryConfirmation = {
      ...baseConfirmation,
      methodology: "Counting failed inspections.",
      technicalNotes: {
        columnMappings: [{ intent: "inspection result", fieldName: "results", rationale: "Direct match for pass/fail status" }],
        assumptions: ["No date range specified — querying all available data"],
        exclusions: ["Rows with null results are excluded"],
      },
    };
    render(<QueryConfirmationCard confirmation={confirmation} onRun={noop} onAdjust={noop} />);

    // Technical details not visible by default
    expect(screen.queryByText(/Direct match for pass/)).not.toBeInTheDocument();

    // Click toggle to reveal
    const toggle = screen.getByRole("button", { name: /technical details/i });
    await user.click(toggle);

    expect(screen.getByText(/Direct match for pass/)).toBeInTheDocument();
    expect(screen.getByText(/No date range specified/)).toBeInTheDocument();
    expect(screen.getByText(/Rows with null results/)).toBeInTheDocument();
  });
});
