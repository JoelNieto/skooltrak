import { IsInt, IsString, Max, Min } from 'class-validator';

/** One plan per grade from `fromLevel` to `toLevel` (at most 20), named "3° Primaria". */
export class BulkCreateStudyPlansInput {
  @IsString()
  schoolId: string;

  @IsString()
  degreeId: string;

  @IsInt()
  @Min(0)
  @Max(30)
  fromLevel: number;

  @IsInt()
  @Min(0)
  @Max(30)
  toLevel: number;
}
