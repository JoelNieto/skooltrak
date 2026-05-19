import { IsNotEmpty, IsOptional } from 'class-validator';

export class RequestJoinSchoolInput {
    @IsNotEmpty()
  schoolId: string;

    @IsNotEmpty()
  requestedRole: string;

    @IsOptional()
  documentId?: string;
}
