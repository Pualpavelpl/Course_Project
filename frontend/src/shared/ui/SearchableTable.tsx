import type { ReactNode } from "react";
import { useTableControls } from "../hooks/useTableControls";
import { DataTable, type TableColumn } from "./DataTable";
import { ListToolbar } from "./ListToolbar";

export interface TableSelection {
  selectedIds: Set<string>;
  clearSelection: () => void;
}

interface SearchableTableProps<Row extends { id: string }> {
  rows: Row[];
  columns: TableColumn<Row>[];
  getSearchText: (row: Row) => string;
  searchLabel: string;
  emptyMessage: string;
  selectable?: boolean;
  actions?: (selection: TableSelection) => ReactNode;
}

export function SearchableTable<Row extends { id: string }>({
  rows,
  columns,
  getSearchText,
  searchLabel,
  emptyMessage,
  selectable = false,
  actions,
}: SearchableTableProps<Row>) {
  const controls = useTableControls(rows, getSearchText, []);
  const selection: TableSelection = {
    selectedIds: controls.selectedIds,
    clearSelection: () => controls.setSelectedIds(new Set()),
  };

  return (
    <>
      <ListToolbar
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchLabel={searchLabel}
        actions={actions?.(selection)}
      />
      {selectable ? (
        <DataTable
          rows={controls.visibleRows}
          columns={columns}
          selectedIds={controls.selectedIds}
          onSelectionChange={controls.setSelectedIds}
          emptyMessage={emptyMessage}
        />
      ) : (
        <DataTable
          rows={controls.visibleRows}
          columns={columns}
          emptyMessage={emptyMessage}
        />
      )}
    </>
  );
}
