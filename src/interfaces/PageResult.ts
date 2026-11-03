export interface PageResult<T> {
  total: number;
  list: T[];
}

export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}
