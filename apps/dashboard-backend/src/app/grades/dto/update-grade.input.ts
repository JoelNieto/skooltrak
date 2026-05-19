import { PartialType } from '@nestjs/swagger';
import { CreateGradeInput } from './create-grade.input';

export class UpdateGradeInput extends PartialType(CreateGradeInput) {
    id: string;
}
