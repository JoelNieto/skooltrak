import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

/** `POST /v1/gradebook/:courseId/publish` (FR-ASM-001.7). */
export class PublishGradesInput {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  gradeIds: string[];
}
