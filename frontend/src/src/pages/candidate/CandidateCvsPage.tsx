import { useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import { initialCandidateCvs, type CandidateCvListItem } from "./candidateCvs.mock";

const columns: TableColumn<CandidateCvListItem>[] = [
  {
    key: "position",
    header: "Position",
    render: (cv) => <Link to={`/candidate/positions/${cv.positionId}`}>{cv.positionName}</Link>,
  },
  { key: "createdAt", header: "Created", render: (cv) => cv.createdAt },
  {
    key: "cv",
    header: "CV",
    render: (cv) => <Link to={`/candidate/cvs/${cv.id}`}>View CV</Link>,
  },
];

export function CandidateCvsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const deletedCvId = (location.state as { deletedCvId?: string } | null)?.deletedCvId;
  const [cvs, setCvs] = useState(() =>
    initialCandidateCvs.filter((cv) => cv.id !== deletedCvId),
  );
  return (
    <>
      <PageHeader
        title="My CVs"
        actions={<Badge bg="secondary">{cvs.length} CVs</Badge>}
      />
      <SearchableTable
        rows={cvs}
        columns={columns}
        getSearchText={(cv) => cv.positionName}
        searchLabel="Search CVs"
        emptyMessage="No CVs found"
        selectable
        actions={({ selectedIds, clearSelection }) => {
          const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : undefined;
          return <>
            <Button
              variant="outline-secondary"
              disabled={!selectedId}
              onClick={() => selectedId && navigate(`${selectedId}/edit`)}
            >
              Edit CV
            </Button>
            <Button
              variant="outline-danger"
              disabled={selectedIds.size === 0}
              onClick={() => {
                setCvs((current) => current.filter((cv) => !selectedIds.has(cv.id)));
                clearSelection();
              }}
            >
              Delete CV
            </Button>
          </>;
        }}
      />
    </>
  );
}
