import { useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import { initialPositions, type PositionListItem } from "./positions.mock";

const columns: TableColumn<PositionListItem>[] = [
  { key: "title", header: "Position", render: (row) => row.title },
  { key: "createdAt", header: "Created", render: (row) => row.createdAt },
  { key: "updatedAt", header: "Updated", render: (row) => row.updatedAt },
];

export function PositionsPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState(initialPositions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : undefined;
  const visiblePositions = useMemo(
    () =>
      positions.filter((position) =>
        position.title.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [positions, search],
  );

  const deleteSelected = () => {
    if (!selectedId) return;
    setPositions((current) => current.filter((position) => position.id !== selectedId));
    setSelectedIds(new Set());
  };

  return (
    <>
      <PageHeader
        title="Positions"
        actions={
          <div className="d-flex flex-column flex-sm-row gap-2">
            <Button variant="success">View positions</Button>
            <Button variant="outline-secondary" onClick={() => navigate("new")}>
              Create position
            </Button>
          </div>
        }
      />

      <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 mb-3">
        <Form.Control
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search positions"
          aria-label="Search positions"
          className="search-control"
        />
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            disabled={!selectedId}
            onClick={() => selectedId && navigate(`${selectedId}/edit`)}
          >
            Edit position
          </Button>
          <Button variant="outline-danger" disabled={!selectedId} onClick={deleteSelected}>
            Delete position
          </Button>
        </div>
      </div>

      <DataTable
        rows={visiblePositions}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage="No positions found"
      />
    </>
  );
}
