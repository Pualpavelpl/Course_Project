import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import type { TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import {
  listAvailablePositions,
  type CandidatePositionListItem,
} from "../positions/positions.api";

const PAGE_SIZE = 20;

const columns: TableColumn<CandidatePositionListItem>[] = [
  {
    key: "name",
    header: "Position name",
    render: (position) => (
      <Link to={`/candidate/positions/${position.id}`}>{position.name}</Link>
    ),
  },
];

export function CandidatePositionsPage() {
  const [rows, setRows] = useState<CandidatePositionListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPositions() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listAvailablePositions(
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
            getApiErrorMessage(
              error,
              "Unable to load available Positions",
            ),
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
  }, [debouncedSearch, page]);

  return (
    <>
      <PageHeader title="Positions" />
      <SearchableTable
        rows={rows}
        columns={columns}
        getSearchText={(position) => position.name}
        searchLabel="Search positions"
        emptyMessage="No available positions found"
        remote={{
          search,
          isLoading,
          errorMessage,
          onSearchChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          pagination: {
            page,
            totalPages,
            onChange: setPage,
          },
        }}
      />
    </>
  );
}
