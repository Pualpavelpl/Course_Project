import { Link } from "react-router-dom";
import { EntityListPage, type FilterOption } from "../../shared/ui/EntityListPage";
import type { TableColumn } from "../../shared/ui/DataTable";
import { initialPositions, type PositionListItem } from "./positions.mock";

const columns: TableColumn<PositionListItem>[] = [
  {
    key: "name",
    header: "Name",
    render: (position) => <Link to={position.id}>{position.name}</Link>,
  },
  { key: "createdAt", header: "Created", render: (position) => position.createdAt },
  { key: "updatedAt", header: "Updated", render: (position) => position.updatedAt },
];

const filters: FilterOption<PositionListItem>[] = [
  {
    label: "Recently updated",
    matches: (position) => position.updatedAt >= "2026-07-18",
  },
];

export function PositionsPage() {
  return (
    <EntityListPage
      title="Positions"
      viewLabel="View positions"
      createLabel="Create position"
      createPath="new"
      editPath={(id) => `${id}/edit`}
      initialRows={initialPositions}
      columns={columns}
      getSearchText={(position) => position.name}
      filterOptions={filters}
      emptyMessage="No positions found"
    />
  );
}
