import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateTeacherInput } from './create-teacher.input';

@InputType()
export class UpdateTeacherInput extends PartialType(CreateTeacherInput) {
  @Field(() => String)
  id: string;
}
