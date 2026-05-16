import { HttpParams } from '@angular/common/http';

export type FetchQueryParams = Partial<{
  skip: number;
  take: number;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
  schoolId: string;
  organizationId: string;
  search: string;
  studyPlanId: string;
  courseId: string;
}>;

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
