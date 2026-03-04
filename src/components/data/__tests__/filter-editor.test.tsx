import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FilterEditor } from "../filter-editor";
import type { DatasetColumn, QueryFilter } from "@/types";

const columns: DatasetColumn[] = [
  { fieldName: "name", name: "Name", dataType: "text" },
  { fieldName: "age", name: "Age", dataType: "number" },
  { fieldName: "created_at", name: "Created At", dataType: "calendar_date" },
];

function makeFilter(overrides: Partial<QueryFilter> = {}): QueryFilter {
  return {
    column: "name",
    operator: "=",
    value: "Alice",
    label: "name equals 'Alice'",
    ...overrides,
  };
}

describe("FilterEditor", () => {
  it("renders filter badges in display mode", () => {
    const filters = [
      makeFilter(),
      makeFilter({
        column: "age",
        operator: ">",
        value: "30",
        label: "age > 30",
      }),
    ];

    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("name equals 'Alice'")).toBeInTheDocument();
    expect(screen.getByText("age > 30")).toBeInTheDocument();
  });

  it("calls onChange when a filter is removed via the X button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const filters = [
      makeFilter(),
      makeFilter({
        column: "age",
        operator: ">",
        value: "30",
        label: "age > 30",
      }),
    ];

    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={onChange}
      />
    );

    // Each badge should have a remove button
    const removeButtons = screen.getAllByRole("button", {
      name: /remove filter/i,
    });
    expect(removeButtons).toHaveLength(2);

    // Click the first remove button
    await user.click(removeButtons[0]);

    // onChange should be called with only the second filter
    expect(onChange).toHaveBeenCalledWith([filters[1]]);
  });

  it("enters edit mode when a badge is clicked", async () => {
    const user = userEvent.setup();
    const filters = [makeFilter()];

    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={vi.fn()}
      />
    );

    // Click the badge text to enter edit mode
    const badge = screen.getByText("name equals 'Alice'");
    await user.click(badge);

    // In edit mode, we should see a column selector (combobox or select trigger)
    expect(
      screen.getByRole("combobox", { name: /column/i })
    ).toBeInTheDocument();
  });

  it("shows an 'Add filter' button", () => {
    render(
      <FilterEditor
        filters={[]}
        availableColumns={columns}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /add filter/i })
    ).toBeInTheDocument();
  });

  it("calls onChange when adding a new filter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FilterEditor
        filters={[]}
        availableColumns={columns}
        onChange={onChange}
      />
    );

    const addButton = screen.getByRole("button", { name: /add filter/i });
    await user.click(addButton);

    // Adding a new filter should call onChange with a new empty filter
    expect(onChange).toHaveBeenCalledTimes(1);
    const newFilters = onChange.mock.calls[0][0];
    expect(newFilters).toHaveLength(1);
    expect(newFilters[0]).toMatchObject({
      column: "",
      operator: "",
      value: "",
    });
  });
});
