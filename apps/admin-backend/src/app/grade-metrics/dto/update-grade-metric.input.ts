import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateGradeMetricInput } from './create-grade-metric.input';

@InputType()
export class UpdateGradeMetricInput extends PartialType(
  CreateGradeMetricInput
) {
  @Field(() => String)
  id: string;
}
