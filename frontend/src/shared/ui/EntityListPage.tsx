import { useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { type FilterOption, useTableControls } from "../hooks/useTableControls";
import { DataTable, type TableColumn } from "./DataTable";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";

interface EntityListPageProps<Row extends { id: string }> {
  title: string;
  viewLabel: string;
  createLabel: string;
  createPath: string;
  editPath: (id: string) => string;
  initialRows: Row[];
  columns: TableColumn<Row>[];
  getSearchText: (row: Row) => string;
  filterOptions: FilterOption<Row>[];
  emptyMessage: string;
  remote?: {
    rows: Row[];
    search: string;
    filterIndex: number | undefined;
    isLoading: boolean;
    errorMessage?: string | undefined;
    onSearchChange: (value: string) => void;
    onFilterChange: (index: number | undefined) => void;
    onDelete: (id: string) => Promise<void>;
    pagination: {
      page: number;
      totalPages: number;
      onChange: (page: number) => void;
    };
  };
}

export function EntityListPage<Row extends { id: string }>({
  title,
  viewLabel,
  createLabel,
  createPath,
  editPath,
  initialRows,
  columns,
  getSearchText,
  filterOptions,
  emptyMessage,
  remote,
}: EntityListPageProps<Row>) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);
  const controls = useTableControls(rows, getSearchText, filterOptions);
  const { selectedIds, setSelectedIds } = controls;
  const displayedRows = remote?.rows ?? controls.visibleRows;
  const selectedIdCandidate =
    selectedIds.size === 1 ? [...selectedIds][0] : undefined;
  const selectedId = displayedRows.some(
    (row) => row.id === selectedIdCandidate,
  )
    ? selectedIdCandidate
    : undefined;

  const deleteSelected = async () => {
    if (!selectedId) return;

    if (remote) {
      try {
        await remote.onDelete(selectedId);
        setSelectedIds(new Set());
      } catch {
        return;
      }

      return;
    }

    setRows((current) => current.filter((row) => row.id !== selectedId));
    setSelectedIds(new Set());
  };

  const changeSearch = (value: string) => {
    setSelectedIds(new Set());
    (remote?.onSearchChange ?? controls.setSearch)(value);
  };

  const changeFilter = (index: number | undefined) => {
    setSelectedIds(new Set());
    (remote?.onFilterChange ?? controls.setFilterIndex)(index);
  };

  return (
    <>
      <PageHeader
        title={title}
        actions={
          <div className="d-flex flex-column flex-sm-row gap-2">
            <span className="btn btn-success" aria-current="page">
              {viewLabel}
            </span>
            <Button variant="outline-secondary" onClick={() => navigate(createPath)}>
              {createLabel}
            </Button>
          </div>
        }
      />

      <ListToolbar
        search={remote?.search ?? controls.search}
        onSearchChange={changeSearch}
        searchLabel={`Search ${title}`}
        {...(filterOptions.length > 0
          ? {
              filter: {
                labels: filterOptions.map((option) => option.label),
                index: remote?.filterIndex ?? controls.filterIndex,
                onChange: changeFilter,
              },
            }
          : {})}
        actions={
          <>
          <Button
            variant="outline-secondary"
            disabled={!selectedId || remote?.isLoading}
            onClick={() => selectedId && navigate(editPath(selectedId))}
          >
            Edit
          </Button>
          <Button
            variant="outline-danger"
            disabled={!selectedId || remote?.isLoading}
            onClick={deleteSelected}
          >
            Delete
          </Button>
          </>
        }
      />

      {remote?.errorMessage ? (
        <Alert variant="danger">{remote.errorMessage}</Alert>
      ) : null}
      {remote?.isLoading ? (
        <Alert variant="info">Loading data...</Alert>
      ) : null}

      <DataTable
        rows={displayedRows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage={remote?.isLoading ? "Loading..." : emptyMessage}
      />

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
