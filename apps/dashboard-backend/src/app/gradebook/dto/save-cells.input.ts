import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';


/** One changed cell (ASM-001-S03, S04). The value rules (BR-ASM-001.2, .8, .14) are checked by the service. */
export class SaveCellInput {
  @IsString()
  gradeId: string;

  @IsString()
  studentId: string;

  /** Null empties the cell. */
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  score: number | null;

  /** Excused (BR-ASM-001.3): no score, left out of every average. Never together with a score. */
  @IsOptional()
  @IsBoolean()
  excused?: boolean;

  /** `updatedAt` of the row as the client loaded it; null when there was no row (BR-ASM-001.7). */
  @IsOptional()
  @IsString()
  updatedAt: string | null;

  /** New comment (BR-ASM-001.14, max 500); omitted when unchanged, empty string clears it. */
  @IsOptional()
  @IsString()
  comment?: string | null;

  /** Reason for this cell only, overriding the save's `reason` (BR-ASM-001.8). */
  @IsOptional()
  @IsString()
  reason?: string;
}

/** `PUT /v1/gradebook/:courseId/cells`: every changed cell of one period, saved together. */
export class SaveCellsInput {
  @IsString()
  periodId: string;

  /** Reason covering every changed published score of this save (BR-ASM-001.8, 3–300 characters). */
  @IsOptional()
  @IsString()
  reason?: string;

  /** FRD §8: up to 40 students × 30 columns per save. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1200)
  @ValidateNested({ each: true })
  @Type(() => SaveCellInput)
  cells: SaveCellInput[];
}
