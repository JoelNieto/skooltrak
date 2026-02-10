import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateSchoolWithOrgInput {
  @Field(() => String, { description: 'Name of the school' })
  @IsNotEmpty()
  schoolName: string;

  @Field(() => String, { description: 'Short name of the school' })
  @IsNotEmpty()
  schoolShortName: string;
}
