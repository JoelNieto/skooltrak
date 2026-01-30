import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateParentInput } from './create-parent.input';

@InputType()
export class UpdateParentInput extends PartialType(CreateParentInput) {
  @Field(() => String)
  id: string;
}
