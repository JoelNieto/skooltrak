import { HttpParams } from '@angular/common/http';

/** Mirrors backend `FetchDataQueryDto` for list endpoints. */
export type FetchQueryParams = Partial<{
  page: number;
  pageSize: number;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
  schoolId: string;
  organizationId: string;
  search: string;
  studyPlanId: string;
  courseId: string;
}>;

/** Largest page the backend accepts (`FetchDataQueryDto.pageSize` max). */
export const MAX_PAGE_SIZE = 100;

/**
 * Converts the paginator's offset state (`skip`/`take`) to the backend's
 * `page`/`pageSize`. The paginator always moves `skip` in steps of `take`.
 */
export function toPageQuery(pagination: { skip(): number; take(): number }): Pick<FetchQueryParams, 'page' | 'pageSize'> {
  const pageSize = pagination.take();
  return { page: Math.floor(pagination.skip() / pageSize) + 1, pageSize };
}

export function toFetchQueryParams(q: FetchQueryParams): HttpParams {
  let p = new HttpParams();
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === null || value === '') continue;
    p = p.set(key, String(value));
  }
  return p;
}

/** Plain query map for `httpResource({ params })`. */
export function toFetchQueryRecord(q: FetchQueryParams): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === null || value === '') continue;
    record[key] = String(value);
  }
  return record;
}
