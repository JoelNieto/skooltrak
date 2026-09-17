export class FetchDataInput {
  page?: number;

  pageSize?: number;

  orderBy?: string;

  orderDirection?: 'asc' | 'desc';

  schoolId?: string;

  search?: string;

  studyPlanId?: string;

  degreeId?: string;
}
