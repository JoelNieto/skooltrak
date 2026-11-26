import { ApiProperty } from '@nestjs/swagger';

/** A habit metric as a school sees it. */
export class SchoolHabitMetric {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ type: String, nullable: true })
  description: string | null;
  @ApiProperty()
  active: boolean;
  @ApiProperty()
  order: number;
  @ApiProperty({ description: "True for the school's own metric, false for a global one" })
  custom: boolean;
  @ApiProperty({ description: "This school's habit evaluations of the metric" })
  usage: number;
}

/** The habit metrics a school uses and whether they are its own or the global ones. */
export class SchoolHabitMetrics {
  @ApiProperty({ description: 'True when the school uses its own habit metrics' })
  custom: boolean;
  @ApiProperty({ type: SchoolHabitMetric, isArray: true })
  metrics: SchoolHabitMetric[];
}
