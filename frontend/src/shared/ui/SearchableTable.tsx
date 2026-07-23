import type { ReactNode } from "react";
import { Alert, Button } from "react-bootstrap";
import { useTableControls } from "../hooks/useTableControls";
import { DataTable, type TableColumn } from "./DataTable";
import { ListToolbar } from "./ListToolbar";

export interface TableSelection {
  selectedIds: Set<string>;
  clearSelection: () => void;
}

interface SearchableTableProps<Row extends { id: string }> {
  rows: Row[];
  columns: TableColumn<Row>[];
  getSearchText: (row: Row) => string;
  searchLabel: string;
  emptyMessage: string;
  selectable?: boolean;
  actions?: (selection: TableSelection) => ReactNode;
  remote?: {
    search: string;
    isLoading: boolean;
    errorMessage?: string | undefined;
    onSearchChange: (value: string) => void;
    pagination: {
      page: number;
      totalPages: number;
      onChange: (page: number) => void;
    };
  };
}

export function SearchableTable<Row extends { id: string }>({
  rows,
  columns,
  getSearchText,
  searchLabel,
  emptyMessage,
  selectable = false,
  actions,
  remote,
}: SearchableTableProps<Row>) {
  const controls = useTableControls(rows, getSearchText, []);
  const selection: TableSelection = {
    selectedIds: controls.selectedIds,
    clearSelection: () => controls.setSelectedIds(new Set()),
  };

  return (
    <>
      <ListToolbar
        search={remote?.search ?? controls.search}
        onSearchChange={remote?.onSearchChange ?? controls.setSearch}
        searchLabel={searchLabel}
        actions={actions?.(selection)}
      />
      {remote?.errorMessage ? (
        <Alert variant="danger">{remote.errorMessage}</Alert>
      ) : null}
      {remote?.isLoading ? (
        <Alert variant="info">Loading data...</Alert>
      ) : null}
      {selectable ? (
        <DataTable
          rows={remote ? rows : controls.visibleRows}
          columns={columns}
          selectedIds={controls.selectedIds}
          onSelectionChange={controls.setSelectedIds}
          emptyMessage={remote?.isLoading ? "Loading..." : emptyMessage}
        />
      ) : (
        <DataTable
          rows={remote ? rows : controls.visibleRows}
          columns={columns}
          emptyMessage={remote?.isLoading ? "Loading..." : emptyMessage}
        />
      )}
      {remote ? (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <Button
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
    </>
  );
}
