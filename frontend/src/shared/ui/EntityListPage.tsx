import { useState } from "react";
import { Button, Dropdown, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { DataTable, type TableColumn } from "./DataTable";
import { PageHeader } from "./PageHeader";

export interface FilterOption<Row> {
  label: string;
  matches: (row: Row) => boolean;
}

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState<number>();
  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : undefined;

  const query = search.trim().toLowerCase();
  const filter = filterIndex === undefined ? undefined : filterOptions[filterIndex];
  const visibleRows = rows.filter(
    (row) =>
      getSearchText(row).toLowerCase().includes(query) &&
      (!filter || filter.matches(row)),
  );

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

      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div className="d-flex flex-column flex-sm-row gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">Filter</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item active={filterIndex === undefined} onClick={() => setFilterIndex(undefined)}>
                All
              </Dropdown.Item>
              {filterOptions.map((option, index) => (
                <Dropdown.Item
                  key={option.label}
                  active={filterIndex === index}
                  onClick={() => setFilterIndex(index)}
                >
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Form.Control
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            aria-label={`Search ${title}`}
            className="search-control"
          />
        </div>

        <div className="d-flex gap-2">
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
        </div>
      </div>

      <DataTable
        rows={visibleRows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage={emptyMessage}
      />
    </>
  );
}
