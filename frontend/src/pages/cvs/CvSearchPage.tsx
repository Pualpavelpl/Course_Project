import { useEffect, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getStoredAuthUser } from "../../shared/api/authApi";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  likeCv,
  listRecruiterCvs,
  unlikeCv,
  type RecruiterCvListItem,
} from "./cvs.api";

const PAGE_SIZE = 20;
const likeFilterLabels = ["Liked by me", "Not liked by me"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat().format(new Date(value));
}

function createColumns(
  isAdmin: boolean,
): TableColumn<RecruiterCvListItem>[] {
  return [
  {
    key: "position",
    header: "Position name",
    render: (cv) => (
      <Link to={`/recruiter/positions/${cv.position.id}`}>
        {cv.position.name}
      </Link>
    ),
  },
  {
    key: "profile",
    header: "Profile",
    render: (cv) => (
      <Link
        to={
          isAdmin
            ? `/admin/candidates/${cv.profile.candidateId}/profile`
            : `/recruiter/profiles/${cv.profile.id}`
        }
      >
        {cv.profile.email}
      </Link>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    render: (cv) => formatDate(cv.createdAt),
  },
  {
    key: "likes",
    header: "Likes",
    render: (cv) => (
      <div className="d-flex align-items-center gap-2">
        <span>{cv.likeCount}</span>
        {cv.likedByCurrentRecruiter ? (
          <Badge bg="success">Liked by you</Badge>
        ) : null}
      </div>
    ),
  },
  {
    key: "cv",
    header: "CV",
    render: (cv) => (
      <Link
        to={
          isAdmin
            ? `/admin/candidates/${cv.profile.candidateId}/cvs/${cv.id}`
            : `/recruiter/cvs/${cv.id}`
        }
      >
        View CV
      </Link>
    ),
  },
  ];
}

export function CvSearchPage() {
  const columns = createColumns(getStoredAuthUser()?.role === "ADMIN");
  const [rows, setRows] = useState<RecruiterCvListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState<number>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const debouncedSearch = useDebouncedValue(search);
  const selectedId =
    selectedIds.size === 1 ? [...selectedIds][0] : undefined;
  const selectedCv = rows.find(({ id }) => id === selectedId);
  const liked =
    filterIndex === 0 ? true : filterIndex === 1 ? false : undefined;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCvs() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listRecruiterCvs(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch || undefined,
            liked,
          },
          abortController.signal,
        );
        setRows(response.items);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Recruiter CV search"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadCvs();
    return () => abortController.abort();
  }, [debouncedSearch, liked, page, refreshVersion]);

  const updateLike = async (shouldLike: boolean) => {
    if (!selectedCv) return;
    setIsUpdatingLike(true);
    setErrorMessage(undefined);

    try {
      if (shouldLike) {
        await likeCv(selectedCv.id);
      } else {
        await unlikeCv(selectedCv.id);
      }

      setSelectedIds(new Set());
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update CV Like"));
    } finally {
      setIsUpdatingLike(false);
    }
  };

  return (
    <>
      <PageHeader title="CV search" />
      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
          setSelectedIds(new Set());
        }}
        searchLabel="Search CVs"
        filter={{
          labels: likeFilterLabels,
          index: filterIndex,
          onChange: (index) => {
            setFilterIndex(index);
            setPage(1);
            setSelectedIds(new Set());
          },
        }}
        actions={
          <>
            <Button
              variant="outline-secondary"
              disabled={
                !selectedCv?.likedByCurrentRecruiter || isUpdatingLike
              }
              onClick={() => void updateLike(false)}
            >
              Remove like
            </Button>
            <Button
              variant="success"
              disabled={
                !selectedCv ||
                selectedCv.likedByCurrentRecruiter ||
                isUpdatingLike
              }
              onClick={() => void updateLike(true)}
            >
              Like
            </Button>
          </>
        }
      />
      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}
      {isLoading ? <div className="alert alert-info">Loading CVs...</div> : null}
      <DataTable
        rows={rows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage={isLoading ? "Loading..." : "No CVs found"}
      />
      <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
        <Button
          variant="outline-secondary"
          disabled={isLoading || page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>
        <span>Page {page} of {Math.max(totalPages, 1)}</span>
        <Button
          variant="outline-secondary"
          disabled={isLoading || totalPages === 0 || page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
