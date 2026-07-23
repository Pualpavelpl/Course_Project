import { useEffect, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  attributeCategories,
  attributeCategoryLabels,
  attributeTypeLabels,
} from "../attributes/attributes.api";
import { ProfileAttributeValueField } from "./ProfileAttributeValueField";
import {
  addProfileAttribute,
  getMyProfile,
  listAvailableProfileAttributes,
  type AvailableProfileAttribute,
  type ProfileAttributeValueInput,
} from "./profile.api";

const PAGE_SIZE = 20;

const columns: TableColumn<AvailableProfileAttribute>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "description",
    header: "Description",
    render: (attribute) => attribute.description,
  },
  {
    key: "type",
    header: "Type",
    render: (attribute) => attributeTypeLabels[attribute.type],
  },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
];

export function AddProfileAttributePage() {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const profilePath = candidateId
    ? `/admin/candidates/${candidateId}/profile`
    : "/candidate/profile";
  const [rows, setRows] = useState<AvailableProfileAttribute[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [profileVersion, setProfileVersion] = useState<number>();
  const [value, setValue] = useState<ProfileAttributeValueInput>({});
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState<number>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const debouncedSearch = useDebouncedValue(search);
  const selectedId =
    selectedIds.size === 1 ? [...selectedIds][0] : undefined;
  const selectedAttribute = rows.find(({ id }) => id === selectedId);
  const category =
    filterIndex === undefined
      ? undefined
      : attributeCategories[filterIndex];

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPage() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const [profile, available] = await Promise.all([
          getMyProfile(abortController.signal, { candidateId }),
          listAvailableProfileAttributes(
            {
              page,
              pageSize: PAGE_SIZE,
              search: debouncedSearch || undefined,
              category,
            },
            abortController.signal,
            { candidateId },
          ),
        ]);
        setProfileVersion(profile.version);
        setRows(available.items);
        setTotalPages(available.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load available Attributes"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadPage();
    return () => abortController.abort();
  }, [candidateId, category, debouncedSearch, page]);

  const changeSelection = (nextIds: Set<string>) => {
    const lastSelectedId = [...nextIds].at(-1);
    setSelectedIds(lastSelectedId ? new Set([lastSelectedId]) : new Set());
    setValue({});
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAttribute || profileVersion === undefined) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await addProfileAttribute(
        profileVersion,
        selectedAttribute.id,
        value,
        { candidateId },
      );
      navigate(profilePath);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to add Profile Attribute"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add profile attribute"
        actions={
          <Button
            variant="outline-secondary"
            onClick={() => navigate(profilePath)}
          >
            Back to profile
          </Button>
        }
      />
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      <ListToolbar
        search={search}
        onSearchChange={(nextSearch) => {
          setSearch(nextSearch);
          setPage(1);
        }}
        searchLabel="Search available attributes"
        filter={{
          labels: attributeCategories.map(
            (item) => attributeCategoryLabels[item],
          ),
          index: filterIndex,
          onChange: (index) => {
            setFilterIndex(index);
            setPage(1);
          },
        }}
      />
      {isLoading ? <Alert variant="info">Loading Attributes...</Alert> : null}
      <DataTable
        rows={rows}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={changeSelection}
        emptyMessage="No available attributes found"
      />
      <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
        <Button
          type="button"
          variant="outline-secondary"
          disabled={isLoading || page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>
        <span>Page {page} of {Math.max(totalPages, 1)}</span>
        <Button
          type="button"
          variant="outline-secondary"
          disabled={isLoading || totalPages === 0 || page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
      {selectedAttribute ? (
        <Form className="mt-3" onSubmit={submit}>
          <Card>
            <Card.Body className="d-grid gap-3">
              <div>
                <h2 className="h5 mb-1">{selectedAttribute.name}</h2>
                <p className="text-secondary mb-0">
                  {selectedAttribute.description}
                </p>
              </div>
              <ProfileAttributeValueField
                type={selectedAttribute.type}
                options={selectedAttribute.options}
                value={value}
                onChange={setValue}
                disabled={isSubmitting}
              />
              <div className="d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add attribute"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Form>
      ) : null}
    </>
  );
}
