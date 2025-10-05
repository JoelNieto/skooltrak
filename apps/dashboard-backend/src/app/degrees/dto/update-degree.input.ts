import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateDegreeInput } from './create-degree.input';

@InputType()
export class UpdateDegreeInput extends PartialType(CreateDegreeInput) {
  @Field(() => String)
  id: string;
}
