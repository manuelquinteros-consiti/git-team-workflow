export interface Paginated<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

/** Paginación con índice de página base 0; la página se ajusta al rango válido. */
export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(0, page), pageCount - 1);
  return {
    items: items.slice(current * size, (current + 1) * size),
    page: current,
    pageCount,
    total: items.length,
  };
}
