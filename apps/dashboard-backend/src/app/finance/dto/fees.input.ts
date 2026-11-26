import { FeeKind, FeeSchedule } from '@generated/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** A fee catalog item (FR-FIN-001.4). */
export class CreateFeeItemInput {
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: FeeKind, enumName: 'FeeKind' })
  @IsEnum(FeeKind)
  kind: FeeKind;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: FeeSchedule, enumName: 'FeeSchedule' })
  @IsEnum(FeeSchedule)
  schedule: FeeSchedule;

  /** ONE_TIME: month of the due date. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  dueMonth?: number;

  /** MONTHLY: first month. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  /** MONTHLY: last month. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;
}

/**
 * Changes to a fee item. Kind and calendar can only change while no charge was generated from it;
 * nothing here touches charges already generated (BR-FIN-001.5).
 */
export class UpdateFeeItemInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: FeeKind, enumName: 'FeeKind' })
  @IsOptional()
  @IsEnum(FeeKind)
  kind?: FeeKind;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ enum: FeeSchedule, enumName: 'FeeSchedule' })
  @IsOptional()
  @IsEnum(FeeSchedule)
  schedule?: FeeSchedule;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  dueMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/** Assign a fee item to a degree or a study plan for a year (FR-FIN-001.5). Give exactly one target. */
export class CreateFeeAssignmentInput {
  @IsString()
  @IsNotEmpty()
  feeItemId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsOptional()
  @IsString()
  degreeId?: string;

  @IsOptional()
  @IsString()
  studyPlanId?: string;

  /** Leave out to charge the item's amount. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountOverride?: number;
}

/** Scope of a charge generation (FR-FIN-001.6). Give exactly one of studyPlanId, classGroupId, studentId. */
export class GenerateChargesInput {
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsOptional()
  @IsString()
  studyPlanId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}
