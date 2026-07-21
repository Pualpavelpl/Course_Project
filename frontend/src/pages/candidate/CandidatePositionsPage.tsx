import { Link } from "react-router-dom";
import type { TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import { initialPositions, type PositionListItem } from "../positions/positions.mock";

const columns: TableColumn<PositionListItem>[] = [
  {
    key: "name",
    header: "Position name",
    render: (position) => (
      <Link to={`/candidate/positions/${position.id}`}>{position.name}</Link>
    ),
  },
];

export function CandidatePositionsPage() {
  return (
    <>
      <PageHeader title="Positions" />
      <SearchableTable
        rows={initialPositions}
        columns={columns}
        getSearchText={(position) => `${position.name} ${position.tags.join(" ")}`}
        searchLabel="Search positions"
        emptyMessage="No positions found"
      />
    </>
  );
}
