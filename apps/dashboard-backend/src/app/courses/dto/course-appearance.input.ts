import { COURSE_COLOR_KEYS } from '@/shared';
import { IsIn, IsOptional } from 'class-validator';

/** `PATCH /v1/courses/:id/appearance` (ACA-001 FR .3): only the color; null goes back to the derived one. */
export class CourseAppearanceInput {
  @IsOptional()
  @IsIn([...COURSE_COLOR_KEYS, null], { message: 'Color de curso inválido' })
  color?: string | null;
}
