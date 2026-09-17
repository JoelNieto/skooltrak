import { FetchDataQueryDto } from '@/api-contracts';

export class FetchCourseFilesInput extends FetchDataQueryDto {
  courseId: string;
}
