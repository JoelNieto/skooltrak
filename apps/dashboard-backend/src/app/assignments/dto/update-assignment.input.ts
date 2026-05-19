import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentInput } from './create-assignment.input';

export class UpdateAssignmentInput extends PartialType(CreateAssignmentInput) {
    id: string;
}
