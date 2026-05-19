import { PartialType } from '@nestjs/swagger';
import { CreatePeriodInput } from './create-period.input';

export class UpdatePeriodInput extends PartialType(CreatePeriodInput) {
    id: string;
}
