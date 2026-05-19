import { PartialType } from '@nestjs/swagger';
import { CreateSubjectInput } from './create-subject.input';

export class UpdateSubjectInput extends PartialType(CreateSubjectInput) {
    id: string;
}
