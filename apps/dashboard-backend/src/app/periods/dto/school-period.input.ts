import { TransformDateToNoon } from '@/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** The school year whose periods an action applies to. */
export class SchoolPeriodsYearInput {
  @ApiProperty({ example: 2026 })
  year: number;
}

/** One of a school's own periods. */
export class CreateSchoolPeriodInput {
  @ApiProperty({ example: 2026, description: 'School year label; dates may cross calendar years' })
  year: number;
  @ApiProperty()
  name: string;
  @ApiPropertyOptional()
  shortName?: string;
  @ApiProperty({ type: String, format: 'date' })
  @TransformDateToNoon()
  startDate: Date;
  @ApiProperty({ type: String, format: 'date' })
  @TransformDateToNoon()
  endDate: Date;
}

/** Changes to one of a school's own periods (its year cannot change). */
export class UpdateSchoolPeriodInput {
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional()
  shortName?: string;
  @ApiPropertyOptional({ type: String, format: 'date' })
  @TransformDateToNoon()
  startDate?: Date;
  @ApiPropertyOptional({ type: String, format: 'date' })
  @TransformDateToNoon()
  endDate?: Date;
}
