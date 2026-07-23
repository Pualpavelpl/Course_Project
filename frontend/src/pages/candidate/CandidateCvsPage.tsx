import { useEffect, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import type { TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import {
  deleteCv,
  listCandidateCvs,
  type CandidateCvListItem,
} from "../cvs/cvs.api";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat().format(new Date(value));
}

const columns: TableColumn<CandidateCvListItem>[] = [
  {
    key: "position",
    header: "Position",
    render: (cv) => (
      <Link to={`/candidate/positions/${cv.position.id}`}>
        {cv.position.name}
      </Link>
    ),
  },
  { key: "createdAt", header: "Created", render: (cv) => formatDate(cv.createdAt) },
  {
    key: "cv",
    header: "CV",
    render: (cv) => <Link to={`/candidate/cvs/${cv.id}`}>View CV</Link>,
  },
];

export function CandidateCvsPage() {
  const [rows, setRows] = useState<CandidateCvListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCvs() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listCandidateCvs(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch || undefined,
          },
          abortController.signal,
        );
        setRows(response.items);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load CVs"));
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadCvs();
    return () => abortController.abort();
  }, [debouncedSearch, page, refreshVersion]);

  const removeSelected = async (
    selectedIds: Set<string>,
    clearSelection: () => void,
  ) => {
    const selectedId =
      selectedIds.size === 1 ? [...selectedIds][0] : undefined;
    if (!selectedId) return;

    try {
      await deleteCv(selectedId);
      clearSelection();
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete CV"));
    }
  };

  return (
    <>
      <PageHeader
        title="My CVs"
        actions={<Badge bg="secondary">{total} CVs</Badge>}
      />
      <SearchableTable
        rows={rows}
        columns={columns}
        getSearchText={(cv) => cv.position.name}
        searchLabel="Search CVs"
        emptyMessage="No CVs found"
        selectable
        actions={({ selectedIds, clearSelection }) => (
          <Button
            variant="outline-danger"
            disabled={selectedIds.size !== 1}
            onClick={() => void removeSelected(selectedIds, clearSelection)}
          >
            Delete CV
          </Button>
        )}
        remote={{
          search,
          isLoading,
          errorMessage,
          onSearchChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          pagination: { page, totalPages, onChange: setPage },
        }}
      />
    </>
  );
}
