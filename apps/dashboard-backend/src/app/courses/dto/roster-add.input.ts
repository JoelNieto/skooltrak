import { IsString, MinLength } from 'class-validator';

/** `POST /v1/courses/:id/roster` (ACA-001 FR .19). */
export class RosterAddInput {
  @IsString()
  @MinLength(1)
  studentId: string;
}
