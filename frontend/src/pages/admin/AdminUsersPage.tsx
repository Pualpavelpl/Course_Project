import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  blockAdminUsers,
  deleteAdminUsers,
  listAdminUsers,
  promoteRecruiter,
  unblockAdminUsers,
  type AdminUserListItem,
  type AdminUserReference,
  type AdminUserRole,
  type AdminUserStatus,
} from "./adminUsers.api";
import { CreateRecruiterModal } from "./CreateRecruiterModal";

const PAGE_SIZE = 20;
const roleFilters: Array<{ label: string; value: AdminUserRole }> = [
  { label: "Candidate", value: "CANDIDATE" },
  { label: "Recruiter", value: "RECRUITER" },
  { label: "Admin", value: "ADMIN" },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat().format(new Date(value));
}

const columns: TableColumn<AdminUserListItem>[] = [
  {
    key: "displayName",
    header: "User name",
    render: (user) => user.displayName,
  },
  {
    key: "profile",
    header: "Profile",
    render: (user) =>
      user.role === "CANDIDATE" && user.profileId ? (
        <Link to={`/admin/candidates/${user.id}/profile`}>Open profile</Link>
      ) : (
        <span className="text-secondary">—</span>
      ),
  },
  { key: "role", header: "Role", render: (user) => user.role },
  {
    key: "status",
    header: "Status",
    render: (user) => (
      <Badge bg={user.status === "ACTIVE" ? "success" : "danger"}>
        {user.status}
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    render: (user) => formatDate(user.createdAt),
  },
];

export function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [roleFilterIndex, setRoleFilterIndex] = useState<number>();
  const [status, setStatus] = useState<AdminUserStatus>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [createRecruiterOpen, setCreateRecruiterOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const debouncedSearch = useDebouncedValue(search);
  const role = roleFilterIndex === undefined
    ? undefined
    : roleFilters[roleFilterIndex]?.value;
  const selectedUsers = useMemo(
    () => rows.filter((user) => selectedIds.has(user.id)),
    [rows, selectedIds],
  );
  const selectedReferences: AdminUserReference[] = selectedUsers.map(
    ({ id, role: userRole }) => ({ id, role: userRole }),
  );
  const selectedRecruiter =
    selectedUsers.length === 1 && selectedUsers[0]?.role === "RECRUITER"
      ? selectedUsers[0]
      : undefined;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listAdminUsers(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch || undefined,
            role,
            status,
          },
          abortController.signal,
        );
        setRows(response.items);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Users"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadUsers();
    return () => abortController.abort();
  }, [debouncedSearch, page, refreshVersion, role, status]);

  const runBulkMutation = async (
    action: (users: AdminUserReference[]) => Promise<unknown>,
    fallbackMessage: string,
  ) => {
    if (selectedReferences.length === 0) return;
    setIsMutating(true);
    setErrorMessage(undefined);

    try {
      await action(selectedReferences);
      setSelectedIds(new Set());
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, fallbackMessage));
    } finally {
      setIsMutating(false);
    }
  };

  const promoteSelected = async () => {
    if (
      !selectedRecruiter ||
      !window.confirm(
        `Promote ${selectedRecruiter.email} from Recruiter to Admin?`,
      )
    ) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(undefined);

    try {
      await promoteRecruiter(selectedRecruiter.id);
      setSelectedIds(new Set());
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to promote Recruiter"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        actions={
          <Button
            variant="success"
            onClick={() => {
              setSuccessMessage(undefined);
              setCreateRecruiterOpen(true);
            }}
          >
            Create Recruiter
          </Button>
        }
      />
      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
          setSelectedIds(new Set());
        }}
        searchLabel="Search users"
        filter={{
          labels: roleFilters.map(({ label }) => label),
          index: roleFilterIndex,
          onChange: (index) => {
            setRoleFilterIndex(index);
            setPage(1);
            setSelectedIds(new Set());
          },
        }}
        actions={
          <>
            <Form.Select
              aria-label="Filter by status"
              value={status ?? "ALL"}
              onChange={(event) => {
                const value = event.target.value;
                setStatus(
                  value === "ALL"
                    ? undefined
                    : (value as AdminUserStatus),
                );
                setPage(1);
                setSelectedIds(new Set());
              }}
              disabled={isLoading || isMutating}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </Form.Select>
            <Button
              variant="outline-secondary"
              disabled={!selectedRecruiter || isMutating}
              onClick={() => void promoteSelected()}
            >
              Change Role
            </Button>
            <Button
              variant="outline-secondary"
              disabled={selectedUsers.length === 0 || isMutating}
              onClick={() =>
                void runBulkMutation(blockAdminUsers, "Unable to block Users")
              }
            >
              Block
            </Button>
            <Button
              variant="outline-secondary"
              disabled={selectedUsers.length === 0 || isMutating}
              onClick={() =>
                void runBulkMutation(
                  unblockAdminUsers,
                  "Unable to unblock Users",
                )
              }
            >
              Unblock
            </Button>
            <Button
              variant="outline-danger"
              disabled={selectedUsers.length === 0 || isMutating}
              onClick={() => {
                if (window.confirm("Delete the selected Users?")) {
                  void runBulkMutation(
                    deleteAdminUsers,
                    "Unable to delete Users",
                  );
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      />
      {successMessage ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      {isLoading ? <Alert variant="info">Loading Users...</Alert> : null}
      <DataTable
        rows={rows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyMessage={isLoading ? "Loading..." : "No Users found"}
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
      <CreateRecruiterModal
        show={createRecruiterOpen}
        onHide={() => setCreateRecruiterOpen(false)}
        onCreated={(email) => {
          setSuccessMessage(`Recruiter ${email} was created.`);
          setPage(1);
          setRefreshVersion((current) => current + 1);
        }}
      />
    </>
  );
}
