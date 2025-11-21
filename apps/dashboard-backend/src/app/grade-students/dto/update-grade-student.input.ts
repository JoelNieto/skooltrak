import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateGradeStudentInput } from './create-grade-student.input';

@InputType()
export class UpdateGradeStudentInput extends PartialType(
  CreateGradeStudentInput
) {
  @Field(() => String)
  id: string;
}
