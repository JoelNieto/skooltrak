import { TransformDateToNoon } from '@/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** A school's adjustment of one global period. Empty / omitted / null fields use the global value. */
export class SchoolPeriodOverrideInput {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  shortName?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @TransformDateToNoon()
  startDate?: Date | null;
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @TransformDateToNoon()
  endDate?: Date | null;
}
