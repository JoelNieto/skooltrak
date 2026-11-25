import { IsArray, IsOptional, IsString } from 'class-validator';

/** Courses to copy from another plan of the same school into this one. */
export class CopyCoursesInput {
  @IsString()
  sourceStudyPlanId: string;

  /** The subjects to copy; all of the source plan's when left out or empty. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];
}
