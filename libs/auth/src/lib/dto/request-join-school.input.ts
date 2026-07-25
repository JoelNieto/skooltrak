import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

/**
 * Join-request payload. The required fields depend on `requestedRole`:
 *  - STUDENT / TEACHER / ORG_ADMIN -> `schoolId` + `documentId`
 *  - PARENT -> `enrollmentCode` (the school is derived from the code)
 * The service enforces this per-role contract; `schoolId` is optional at the
 * DTO level because it is not needed for PARENT joins.
 */
export class RequestJoinSchoolInput {
  @IsOptional()
  @ValidateIf((o) => o.requestedRole !== 'PARENT')
  @IsNotEmpty()
  schoolId?: string;

  @IsNotEmpty()
  requestedRole: string;

  @IsOptional()
  documentId?: string;

  @IsOptional()
  enrollmentCode?: string;
}
