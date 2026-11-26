import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** One of a school's own habit metrics. */
export class CreateSchoolHabitMetricInput {
  @ApiProperty()
  name: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
  @ApiPropertyOptional({ default: true })
  active?: boolean;
  @ApiPropertyOptional({ description: 'Position in lists and the report card; defaults to last' })
  order?: number;
}

/** Changes to one of a school's own habit metrics. */
export class UpdateSchoolHabitMetricInput {
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
  @ApiPropertyOptional()
  active?: boolean;
  @ApiPropertyOptional()
  order?: number;
}
