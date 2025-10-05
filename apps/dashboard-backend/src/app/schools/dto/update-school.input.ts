import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateSchoolInput } from './create-school.input';

@InputType()
export class UpdateSchoolInput extends PartialType(CreateSchoolInput) {
  @Field(() => String)
  id: string;
}
