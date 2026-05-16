import { FetchDataQueryDto } from '@/api-contracts';
import { FetchDataInput } from './fetch-data.input';

export function toFetchDataInput(q: FetchDataQueryDto): FetchDataInput {
  return {
    skip: q.skip,
    take: q.take,
    orderBy: q.orderBy ?? 'name',
    orderDirection: q.orderDirection ?? 'asc',
    schoolId: q.schoolId,
    studyPlanId: q.studyPlanId,
    search: q.search ?? '',
  };
}

/** For endpoints that need courseId on the query (e.g. files for course). */
export function toFetchCourseFilesInput(q: FetchDataQueryDto & { courseId: string }) {
  return {
    ...toFetchDataInput(q),
    courseId: q.courseId,
  };
}
