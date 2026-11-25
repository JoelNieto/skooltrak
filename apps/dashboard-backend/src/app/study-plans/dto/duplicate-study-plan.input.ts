import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

/** A copy of a plan with its overrides, enrollment costs and (by default) its courses. */
export class DuplicateStudyPlanInput {
  @IsString()
  name: string;

  @IsString()
  shortName: string;

  @IsInt()
  @Min(0)
  level: number;

  /** The copy's degree; the source plan's when left out. Must be in the same school. */
  @IsOptional()
  @IsString()
  degreeId?: string;

  /** Copy the courses (subjects, appearance and grade categories; not teachers). Default true. */
  @IsOptional()
  @IsBoolean()
  copyCourses?: boolean;
}
