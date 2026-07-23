import type { TableColumn } from "./DataTable";
import type { FilterOption } from "../hooks/useTableControls";
import { useTableControls } from "../hooks/useTableControls";
import { Alert, Button, Card } from "react-bootstrap";
import { DataTable } from "./DataTable";
import { ListToolbar } from "./ListToolbar";

interface SelectableListSectionProps<Row extends { id: string }> {
  title: string;
  rows: Row[];
  columns: TableColumn<Row>[];
  getSearchText: (row: Row) => string;
  filterOptions: FilterOption<Row>[];
  selectedIds?: Set<string> | undefined;
  onSelectionChange?: ((ids: Set<string>) => void) | undefined;
  remote?: {
    search: string;
    filterIndex: number | undefined;
    isLoading: boolean;
    errorMessage?: string | undefined;
    onSearchChange: (value: string) => void;
    onFilterChange: (index: number | undefined) => void;
    pagination: {
      page: number;
      totalPages: number;
      onChange: (page: number) => void;
    };
  };
}

export function SelectableListSection<Row extends { id: string }>({
  title,
  rows,
  columns,
  getSearchText,
  filterOptions,
  selectedIds,
  onSelectionChange,
  remote,
}: SelectableListSectionProps<Row>) {
  const controls = useTableControls(rows, getSearchText, filterOptions);
  const activeSelectedIds = selectedIds ?? controls.selectedIds;
  const changeSelection = onSelectionChange ?? controls.setSelectedIds;

  return (
    <Card>
      <Card.Header>{title}</Card.Header>
      <Card.Body>
        <ListToolbar
          search={remote?.search ?? controls.search}
          onSearchChange={remote?.onSearchChange ?? controls.setSearch}
          searchLabel={`Search ${title}`}
          {...(filterOptions.length > 0
            ? {
                filter: {
                  labels: filterOptions.map((option) => option.label),
                  index: remote?.filterIndex ?? controls.filterIndex,
                  onChange:
                    remote?.onFilterChange ?? controls.setFilterIndex,
                },
              }
            : {})}
          actions={
            <span className="align-self-center text-secondary">
              {activeSelectedIds.size} selected
            </span>
          }
        />
        {remote?.errorMessage ? (
          <Alert variant="danger">{remote.errorMessage}</Alert>
        ) : null}
        {remote?.isLoading ? (
          <Alert variant="info">Loading data...</Alert>
        ) : null}
        <DataTable
          rows={remote ? rows : controls.visibleRows}
          columns={columns}
          selectedIds={activeSelectedIds}
          onSelectionChange={changeSelection}
          emptyMessage={
            remote?.isLoading
              ? "Loading..."
              : `No ${title.toLowerCase()} found`
          }
        />
        {remote ? (
          <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
            <Button
              type="button"
              variant="outline-secondary"
              disabled={remote.isLoading || remote.pagination.page <= 1}
              onClick={() =>
                remote.pagination.onChange(remote.pagination.page - 1)
              }
            >
              Previous
            </Button>
            <span>
              Page {remote.pagination.page} of{" "}
              {Math.max(remote.pagination.totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="outline-secondary"
              disabled={
                remote.isLoading ||
                remote.pagination.totalPages === 0 ||
                remote.pagination.page >= remote.pagination.totalPages
              }
              onClick={() =>
                remote.pagination.onChange(remote.pagination.page + 1)
              }
            >
              Next
            </Button>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
