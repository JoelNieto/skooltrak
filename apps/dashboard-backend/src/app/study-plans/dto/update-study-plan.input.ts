import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateStudyPlanInput } from './create-study-plan.input';

@InputType()
export class UpdateStudyPlanInput extends PartialType(CreateStudyPlanInput) {
  @Field(() => String)
  id: string;
}
