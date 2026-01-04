import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateStudentGradeInput } from './create-student-grade.input';

@InputType()
export class UpdateStudentGradeInput extends PartialType(
  CreateStudentGradeInput
) {
  @Field(() => String)
  id: string;
}
