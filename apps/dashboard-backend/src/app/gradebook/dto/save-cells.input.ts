import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** One changed cell (ASM-001-S03). The value rules (BR-ASM-001.2) are checked by the service. */
export class SaveCellInput {
  @IsString()
  gradeId: string;

  @IsString()
  studentId: string;

  /** Null empties the cell. */
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  score: number | null;

  /** `updatedAt` of the row as the client loaded it; null when there was no row (BR-ASM-001.7). */
  @IsOptional()
  @IsString()
  updatedAt: string | null;
}

/** `PUT /v1/gradebook/:courseId/cells`: every changed cell of one period, saved together. */
export class SaveCellsInput {
  @IsString()
  periodId: string;

  /** FRD §8: up to 40 students × 30 columns per save. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1200)
  @ValidateNested({ each: true })
  @Type(() => SaveCellInput)
  cells: SaveCellInput[];
}
