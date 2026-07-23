import { getPagination } from "../../shared/http/pagination.js";
import { findTagList } from "./tag.repository.js";
import type { ListTagsRequest } from "./tag.validation.js";

export async function listTags(query: ListTagsRequest["query"]) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findTagList({
    skip,
    take,
    search: query.search,
  });

  return {
    items: result.items,
    pagination: {
      page: query.page,
      pageSize: take,
      total: result.total,
      totalPages: Math.ceil(result.total / take),
    },
  };
}
