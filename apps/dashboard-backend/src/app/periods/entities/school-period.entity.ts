import { ApiProperty } from '@nestjs/swagger';

/** The global period's values. */
export class SchoolPeriodDefaults {
  @ApiProperty()
  name: string;
  @ApiProperty()
  shortName: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;
}

/** The school's changes; null fields use the global value. */
export class SchoolPeriodOverride {
  @ApiProperty({ type: String, nullable: true })
  name: string | null;
  @ApiProperty({ type: String, nullable: true })
  shortName: string | null;
  @ApiProperty({ type: Date, nullable: true })
  startDate: Date | null;
  @ApiProperty({ type: Date, nullable: true })
  endDate: Date | null;
}

/** A period as a school sees it, with the global defaults and the school's override. */
export class SchoolPeriod {
  @ApiProperty()
  id: string;
  @ApiProperty()
  year: number;
  /** Effective values (override applied). */
  @ApiProperty()
  name: string;
  @ApiProperty()
  shortName: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;
  @ApiProperty({ description: 'True when the school changed at least one field' })
  overridden: boolean;
  @ApiProperty({ type: SchoolPeriodDefaults })
  defaults: SchoolPeriodDefaults;
  @ApiProperty({ type: SchoolPeriodOverride, nullable: true })
  override: SchoolPeriodOverride | null;
}
