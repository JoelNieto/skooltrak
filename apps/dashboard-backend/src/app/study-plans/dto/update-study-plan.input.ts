import { PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateStudyPlanInput } from './create-study-plan.input';

export class UpdateStudyPlanInput extends PartialType(CreateStudyPlanInput) {
  @IsString()
  id: string;
}
