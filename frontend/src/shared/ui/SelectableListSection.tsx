import type { TableColumn } from "./DataTable";
import type { FilterOption } from "../hooks/useTableControls";
import { useTableControls } from "../hooks/useTableControls";
import { Card } from "react-bootstrap";
import { DataTable } from "./DataTable";
import { ListToolbar } from "./ListToolbar";

interface SelectableListSectionProps<Row extends { id: string }> {
  title: string;
  rows: Row[];
  columns: TableColumn<Row>[];
  getSearchText: (row: Row) => string;
  filterOptions: FilterOption<Row>[];
}

export function SelectableListSection<Row extends { id: string }>({
  title,
  rows,
  columns,
  getSearchText,
  filterOptions,
}: SelectableListSectionProps<Row>) {
  const controls = useTableControls(rows, getSearchText, filterOptions);

  return (
    <Card>
      <Card.Header>{title}</Card.Header>
      <Card.Body>
        <ListToolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          searchLabel={`Search ${title}`}
          filter={{
            labels: filterOptions.map((option) => option.label),
            index: controls.filterIndex,
            onChange: controls.setFilterIndex,
          }}
          actions={<span className="align-self-center text-secondary">{controls.selectedIds.size} selected</span>}
        />
        <DataTable
          rows={controls.visibleRows}
          columns={columns}
          selectedIds={controls.selectedIds}
          onSelectionChange={controls.setSelectedIds}
          emptyMessage={`No ${title.toLowerCase()} found`}
        />
      </Card.Body>
    </Card>
  );
}
