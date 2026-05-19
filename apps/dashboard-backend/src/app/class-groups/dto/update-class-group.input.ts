import { PartialType } from '@nestjs/swagger';
import { CreateClassGroupInput } from './create-class-group.input';

export class UpdateClassGroupInput extends PartialType(CreateClassGroupInput) {
    id: string;
}
