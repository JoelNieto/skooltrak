import { PartialType } from '@nestjs/swagger';
import { CreateTeacherInput } from './create-teacher.input';

export class UpdateTeacherInput extends PartialType(CreateTeacherInput) {
    id: string;
}
