import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import type { TableColumn } from "../../shared/ui/DataTable";
import { EntityListPage } from "../../shared/ui/EntityListPage";
import {
  deletePosition,
  listPositions,
  type PositionListItem,
} from "./positions.api";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat().format(new Date(value));
}

const columns: TableColumn<PositionListItem>[] = [
  {
    key: "name",
    header: "Name",
    render: (position) => <Link to={position.id}>{position.name}</Link>,
  },
  {
    key: "createdAt",
    header: "Created",
    render: (position) => formatDate(position.createdAt),
  },
  {
    key: "updatedAt",
    header: "Updated",
    render: (position) => formatDate(position.updatedAt),
  },
];

export function PositionsPage() {
  const [rows, setRows] = useState<PositionListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPositions() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listPositions(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch || undefined,
          },
          abortController.signal,
        );

        setRows(response.items);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Positions"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPositions();
    return () => abortController.abort();
  }, [debouncedSearch, page, refreshVersion]);

  const removePosition = async (id: string) => {
    setErrorMessage(undefined);

    try {
      await deletePosition(id);

      if (rows.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setRefreshVersion((version) => version + 1);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to delete Position"),
      );
      throw error;
    }
  };

  return (
    <EntityListPage
      title="Positions"
      viewLabel="View positions"
      createLabel="Create position"
      createPath="new"
      editPath={(id) => `${id}/edit`}
      initialRows={[]}
      columns={columns}
      getSearchText={(position) => position.name}
      filterOptions={[]}
      emptyMessage="No positions found"
      remote={{
        rows,
        search,
        filterIndex: undefined,
        isLoading,
        errorMessage,
        onSearchChange: (value) => {
          setSearch(value);
          setPage(1);
        },
        onFilterChange: () => undefined,
        onDelete: removePosition,
        pagination: {
          page,
          totalPages,
          onChange: setPage,
        },
      }}
    />
  );
}
