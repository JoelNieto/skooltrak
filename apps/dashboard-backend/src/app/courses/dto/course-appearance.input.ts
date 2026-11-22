import { COURSE_COLOR_KEYS, SUBJECT_ICON_NAMES } from '@/shared';
import { IsIn, IsOptional } from 'class-validator';

/**
 * `PATCH /v1/courses/:id/appearance` (ACA-001 FR .3): the color and the icon. A field left out
 * stays as it is; null goes back to the derived color or the subject's icon.
 */
export class CourseAppearanceInput {
  @IsOptional()
  @IsIn([...COURSE_COLOR_KEYS, null], { message: 'Color de curso inválido' })
  color?: string | null;

  @IsOptional()
  @IsIn([...SUBJECT_ICON_NAMES, null], { message: 'Ícono de curso inválido' })
  icon?: string | null;
}
