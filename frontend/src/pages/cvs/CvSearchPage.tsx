import { useState } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTableControls } from "../../shared/hooks/useTableControls";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import { initialCvs, type CvSearchListItem } from "./cvs.mock";

const columns: TableColumn<CvSearchListItem>[] = [
  {
    key: "position",
    header: "Position name",
    render: (cv) => <Link to={`/recruiter/positions/${cv.positionId}`}>{cv.positionName}</Link>,
  },
  {
    key: "profile",
    header: "Profile name",
    render: (cv) => <Link to={`/recruiter/profiles/${cv.profileId}`}>{cv.profileName}</Link>,
  },
  {
    key: "createdAt",
    header: "Created",
    render: (cv) => cv.createdAt,
  },
  {
    key: "cv",
    header: "CV",
    render: (cv) => <Link to={`/recruiter/cvs/${cv.id}`}>View CV</Link>,
  },
];

export function CvSearchPage() {
  const [cvs, setCvs] = useState(initialCvs);
  const controls = useTableControls(
    cvs,
    (cv) => `${cv.positionName} ${cv.profileName}`,
    [],
  );
  const selectedCvs = cvs.filter((cv) => controls.selectedIds.has(cv.id));
  const canLike = selectedCvs.some((cv) => !cv.liked);
  const canRemoveLike = selectedCvs.some((cv) => cv.liked);

  const setLike = (liked: boolean) => {
    setCvs((current) =>
      current.map((cv) =>
        controls.selectedIds.has(cv.id) ? { ...cv, liked } : cv,
      ),
    );
  };

  return (
    <>
      <PageHeader title="CV search" />
      <ListToolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchLabel="Search CVs"
        actions={
          <>
            <Button variant="outline-secondary" disabled={!canRemoveLike} onClick={() => setLike(false)}>
              Remove like
            </Button>
            <Button variant="success" disabled={!canLike} onClick={() => setLike(true)}>
              Like
            </Button>
          </>
        }
      />
      <DataTable
        rows={controls.visibleRows}
        columns={columns}
        selectedIds={controls.selectedIds}
        onSelectionChange={controls.setSelectedIds}
        emptyMessage="No CVs found"
      />
    </>
  );
}
