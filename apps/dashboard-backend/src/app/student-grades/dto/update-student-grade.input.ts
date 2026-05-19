import { PartialType } from '@nestjs/swagger';
import { CreateStudentGradeInput } from './create-student-grade.input';

export class UpdateStudentGradeInput extends PartialType(
  CreateStudentGradeInput
) {
    id: string;
}
