import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateClassGroupInput } from './create-class-group.input';

@InputType()
export class UpdateClassGroupInput extends PartialType(CreateClassGroupInput) {
  @Field(() => String)
  id: string;
}
