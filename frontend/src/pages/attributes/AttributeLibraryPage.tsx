import { EntityListPage, type FilterOption } from "../../shared/ui/EntityListPage";
import type { TableColumn } from "../../shared/ui/DataTable";
import { initialAttributes, type AttributeListItem } from "./attributes.mock";

const columns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "description",
    header: "Description",
    render: (attribute) => attribute.description,
  },
  { key: "createdAt", header: "Created", render: (attribute) => attribute.createdAt },
  { key: "updatedAt", header: "Updated", render: (attribute) => attribute.updatedAt },
];

const categories = ["Personal Information", "Certification", "Soft Skills"] as const;
const filters: FilterOption<AttributeListItem>[] = categories.map((category) => ({
  label: category,
  matches: (attribute) => attribute.category === category,
}));

export function AttributeLibraryPage() {
  return (
    <EntityListPage
      title="Attribute library"
      viewLabel="View attributes"
      createLabel="Create attribute"
      createPath="new"
      editPath={(id) => `${id}/edit`}
      initialRows={initialAttributes}
      columns={columns}
      getSearchText={(attribute) => `${attribute.name} ${attribute.description}`}
      filterOptions={filters}
      emptyMessage="No attributes found"
    />
  );
}
