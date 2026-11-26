import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * A manual charge (FR-FIN-001.7) for one student, or for every active student of a class group.
 * Give exactly one of `studentId` and `classGroupId`.
 */
export class CreateChargeInput {
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  /** `YYYY-MM-DD` */
  @IsDateString({ strict: true })
  dueDate: string;
}

export class CreateChargeResult {
  created: number;
  chargeIds: string[];
}
