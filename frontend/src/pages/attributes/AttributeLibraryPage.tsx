import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import type { TableColumn } from "../../shared/ui/DataTable";
import { EntityListPage } from "../../shared/ui/EntityListPage";
import {
  attributeCategories,
  attributeCategoryLabels,
  deleteAttribute,
  listAttributes,
  type AttributeListItem,
} from "./attributes.api";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat().format(new Date(value));
}

const columns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "description",
    header: "Description",
    render: (attribute) => attribute.description,
  },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
  {
    key: "createdAt",
    header: "Created",
    render: (attribute) => formatDate(attribute.createdAt),
  },
  {
    key: "updatedAt",
    header: "Updated",
    render: (attribute) => formatDate(attribute.updatedAt),
  },
];

const filters: FilterOption<AttributeListItem>[] = attributeCategories.map(
  (category) => ({
    label: attributeCategoryLabels[category],
    matches: (attribute) => attribute.category === category,
  }),
);

export function AttributeLibraryPage() {
  const [rows, setRows] = useState<AttributeListItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState<number>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const debouncedSearch = useDebouncedValue(search);
  const category =
    filterIndex === undefined
      ? undefined
      : attributeCategories[filterIndex];

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAttributes() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await listAttributes(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch || undefined,
            category,
          },
          abortController.signal,
        );

        setRows(response.items);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Attributes"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAttributes();
    return () => abortController.abort();
  }, [category, debouncedSearch, page, refreshVersion]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeFilter = (index: number | undefined) => {
    setFilterIndex(index);
    setPage(1);
  };

  const removeAttribute = async (id: string) => {
    setErrorMessage(undefined);

    try {
      await deleteAttribute(id);

      if (rows.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setRefreshVersion((currentVersion) => currentVersion + 1);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to delete Attribute"),
      );
      throw error;
    }
  };

  return (
    <EntityListPage
      title="Attribute library"
      viewLabel="View attributes"
      createLabel="Create attribute"
      createPath="new"
      editPath={(id) => `${id}/edit`}
      initialRows={[]}
      columns={columns}
      getSearchText={(attribute) =>
        `${attribute.name} ${attribute.description}`
      }
      filterOptions={filters}
      emptyMessage="No attributes found"
      remote={{
        rows,
        search,
        filterIndex,
        isLoading,
        errorMessage,
        onSearchChange: changeSearch,
        onFilterChange: changeFilter,
        onDelete: removeAttribute,
        pagination: {
          page,
          totalPages,
          onChange: setPage,
        },
      }}
    />
  );
}
