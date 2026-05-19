import { PartialType } from '@nestjs/swagger';
import { CreateDegreeInput } from './create-degree.input';

export class UpdateDegreeInput extends PartialType(CreateDegreeInput) {
    id: string;
}
