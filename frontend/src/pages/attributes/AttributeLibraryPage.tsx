import type { FilterOption } from "../../shared/hooks/useTableControls";
import type { TableColumn } from "../../shared/ui/DataTable";
import { EntityListPage } from "../../shared/ui/EntityListPage";
import {
  attributeCategories,
  initialAttributes,
  type AttributeListItem,
} from "./attributes.mock";

const columns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "description",
    header: "Description",
    render: (attribute) => attribute.description,
  },
  { key: "category", header: "Category", render: (attribute) => attribute.category },
  { key: "createdAt", header: "Created", render: (attribute) => attribute.createdAt },
  { key: "updatedAt", header: "Updated", render: (attribute) => attribute.updatedAt },
];

const filters: FilterOption<AttributeListItem>[] = attributeCategories.map((category) => ({
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
