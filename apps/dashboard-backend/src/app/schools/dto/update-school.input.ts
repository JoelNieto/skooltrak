import { PartialType } from '@nestjs/swagger';
import { CreateSchoolInput } from './create-school.input';

export class UpdateSchoolInput extends PartialType(CreateSchoolInput) {
    id: string;

    currentYear?: number;
}
