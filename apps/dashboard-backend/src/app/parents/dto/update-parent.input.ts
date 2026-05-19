import { PartialType } from '@nestjs/swagger';
import { CreateParentInput } from './create-parent.input';

export class UpdateParentInput extends PartialType(CreateParentInput) {
    id: string;
}
