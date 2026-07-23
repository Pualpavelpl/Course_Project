const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function getPagination(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const normalizedPage = Math.max(DEFAULT_PAGE, Math.floor(page));
  const take = Math.min(
    MAX_PAGE_SIZE,
    Math.max(DEFAULT_PAGE, Math.floor(pageSize)),
  );

  return {
    skip: (normalizedPage - 1) * take,
    take,
  };
}
