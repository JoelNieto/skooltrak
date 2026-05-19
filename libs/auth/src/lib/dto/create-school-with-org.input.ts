import { IsNotEmpty } from 'class-validator';

export class CreateSchoolWithOrgInput {
    @IsNotEmpty()
  schoolName: string;

    @IsNotEmpty()
  schoolShortName: string;
}
