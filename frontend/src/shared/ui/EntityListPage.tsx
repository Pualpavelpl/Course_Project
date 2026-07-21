import { useState } from "react";
import { Button } from "react-bootstrap";
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
}: EntityListPageProps<Row>) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);
  const controls = useTableControls(rows, getSearchText, filterOptions);
  const { selectedIds, setSelectedIds } = controls;
  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : undefined;

  const deleteSelected = () => {
    if (!selectedId) return;
    setRows((current) => current.filter((row) => row.id !== selectedId));
    setSelectedIds(new Set());
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
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchLabel={`Search ${title}`}
        filter={{
          labels: filterOptions.map((option) => option.label),
          index: controls.filterIndex,
          onChange: controls.setFilterIndex,
        }}
        actions={
          <>
          <Button
            variant="outline-secondary"
            disabled={!selectedId}
            onClick={() => selectedId && navigate(editPath(selectedId))}
          >
            Edit
          </Button>
          <Button variant="outline-danger" disabled={!selectedId} onClick={deleteSelected}>
            Delete
          </Button>
          </>
        }
      />

      <DataTable
        rows={controls.visibleRows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage={emptyMessage}
      />
    </>
  );
}
