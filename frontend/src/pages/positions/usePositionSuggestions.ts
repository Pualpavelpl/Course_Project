import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import {
  listAttributes,
  type AttributeCategory,
  type AttributeListItem,
} from "../attributes/attributes.api";
import {
  listTags,
  type PaginatedResponse,
  type TagListItem,
} from "./positions.api";

const SUGGESTION_PAGE_SIZE = 10;

interface SuggestionQuery<Filter> {
  page: number;
  pageSize: number;
  search?: string | undefined;
  filter?: Filter | undefined;
}

type SuggestionLoader<Item, Filter> = (
  query: SuggestionQuery<Filter>,
  signal: AbortSignal,
) => Promise<PaginatedResponse<Item>>;

function useSuggestions<Item, Filter>(
  loader: SuggestionLoader<Item, Filter>,
  filter?: Filter,
) {
  const [rows, setRows] = useState<Item[]>([]);
  const [search, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadSuggestions() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const response = await loader(
          {
            page,
            pageSize: SUGGESTION_PAGE_SIZE,
            search: debouncedSearch || undefined,
            filter,
          },
          abortController.signal,
        );

        setRows(response.items);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load suggestions"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSuggestions();
    return () => abortController.abort();
  }, [debouncedSearch, filter, loader, page]);

  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  return {
    rows,
    search,
    page,
    totalPages,
    isLoading,
    errorMessage,
    setSearch,
    setPage,
  };
}

const loadAttributeSuggestions: SuggestionLoader<
  AttributeListItem,
  AttributeCategory
> = async (query, signal) => {
  return listAttributes(
    {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      category: query.filter,
    },
    signal,
  );
};

const loadTagSuggestions: SuggestionLoader<
  TagListItem,
  never
> = async (query, signal) => {
  return listTags(
    {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    },
    signal,
  );
};

export function useAttributeSuggestions(
  category?: AttributeCategory,
) {
  return useSuggestions(loadAttributeSuggestions, category);
}

export function useTagSuggestions() {
  return useSuggestions(loadTagSuggestions);
}
