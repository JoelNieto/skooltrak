import { PartialType } from '@nestjs/swagger';
import { CreateStudyPlanInput } from './create-study-plan.input';

export class UpdateStudyPlanInput extends PartialType(CreateStudyPlanInput) {
    id: string;
}
