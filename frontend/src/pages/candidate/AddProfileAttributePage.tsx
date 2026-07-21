import { useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import { useTableControls } from "../../shared/hooks/useTableControls";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  attributeCategories,
  initialAttributes,
  type AttributeListItem,
} from "../attributes/attributes.mock";
import { initialInfoAttributes, meAttributes } from "./profile.mock";

const usedIds = new Set([...meAttributes, ...initialInfoAttributes].map((attribute) => attribute.id));
const availableAttributes = initialAttributes.filter((attribute) => !usedIds.has(attribute.id));

const columns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  { key: "description", header: "Description", render: (attribute) => attribute.description },
  { key: "type", header: "Type", render: (attribute) => attribute.type },
  { key: "category", header: "Category", render: (attribute) => attribute.category },
];

const filters: FilterOption<AttributeListItem>[] = attributeCategories.map((category) => ({
  label: category,
  matches: (attribute) => attribute.category === category,
}));

export function AddProfileAttributePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(availableAttributes);
  const [addedCount, setAddedCount] = useState(0);
  const controls = useTableControls(
    rows,
    (attribute) => `${attribute.name} ${attribute.description}`,
    filters,
  );

  const addSelected = () => {
    const count = controls.selectedIds.size;
    if (count === 0) return;
    setRows((current) => current.filter((attribute) => !controls.selectedIds.has(attribute.id)));
    controls.setSelectedIds(new Set());
    setAddedCount(count);
  };

  return (
    <>
      <PageHeader
        title="Add profile attribute"
        actions={
          <Button variant="outline-secondary" onClick={() => navigate("/candidate/profile")}>
            Back to profile
          </Button>
        }
      />
      {addedCount > 0 ? <Alert variant="success">Added {addedCount} attribute(s) in the frontend mock.</Alert> : null}
      <ListToolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchLabel="Search available attributes"
        filter={{
          labels: filters.map((filter) => filter.label),
          index: controls.filterIndex,
          onChange: controls.setFilterIndex,
        }}
        actions={
          <Button variant="success" disabled={controls.selectedIds.size === 0} onClick={addSelected}>
            Add selected
          </Button>
        }
      />
      <DataTable
        rows={controls.visibleRows}
        columns={columns}
        selectedIds={controls.selectedIds}
        onSelectionChange={controls.setSelectedIds}
        emptyMessage="No available attributes found"
      />
    </>
  );
}
