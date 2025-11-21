import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateGradeInput } from './create-grade.input';

@InputType()
export class UpdateGradeInput extends PartialType(CreateGradeInput) {
  @Field(() => String)
  id: string;
}
