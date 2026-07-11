import { IsNotEmpty, IsOptional } from 'class-validator';

export class LinkChildInput {
  @IsNotEmpty()
  enrollmentCode: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  middleName?: string;

  @IsOptional()
  fatherName?: string;

  @IsOptional()
  motherName?: string;

  @IsOptional()
  documentId?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  relationship?: string;

  @IsOptional()
  occupation?: string;

  @IsOptional()
  workPhone?: string;

  @IsOptional()
  address?: string;
}
