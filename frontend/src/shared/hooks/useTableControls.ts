import { useState } from "react";

export interface FilterOption<Row> {
  label: string;
  matches: (row: Row) => boolean;
}

export function useTableControls<Row extends { id: string }>(
  rows: Row[],
  getSearchText: (row: Row) => string,
  filterOptions: FilterOption<Row>[],
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState<number>();
  const query = search.trim().toLowerCase();
  const filter = filterIndex === undefined ? undefined : filterOptions[filterIndex];
  const visibleRows = rows.filter(
    (row) =>
      getSearchText(row).toLowerCase().includes(query) &&
      (!filter || filter.matches(row)),
  );

  return {
    filterIndex,
    search,
    selectedIds,
    setFilterIndex,
    setSearch,
    setSelectedIds,
    visibleRows,
  };
}
