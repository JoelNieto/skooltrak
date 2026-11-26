import { ApiProperty } from '@nestjs/swagger';

/** A period as a school sees it. */
export class SchoolPeriod {
  @ApiProperty()
  id: string;
  @ApiProperty()
  year: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  shortName: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;
  @ApiProperty({ description: "True for the school's own period, false for a global one" })
  custom: boolean;
  @ApiProperty({ description: "This school's grade columns and habit evaluations in the period" })
  usage: number;
}

/** A school's periods for one year and whether they are its own or the global ones. */
export class SchoolPeriodsYear {
  @ApiProperty()
  year: number;
  @ApiProperty({ description: 'True when the school uses its own periods this year' })
  custom: boolean;
  @ApiProperty({ type: SchoolPeriod, isArray: true })
  periods: SchoolPeriod[];
}
