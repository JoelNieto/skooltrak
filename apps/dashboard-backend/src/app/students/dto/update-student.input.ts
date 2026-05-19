import { PartialType } from '@nestjs/swagger';
import { CreateStudentInput } from './create-student.input';

export class UpdateStudentInput extends PartialType(CreateStudentInput) {
    id: string;
}
