import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateHabitMetricInput } from './create-habit-metric.input';

@InputType()
export class UpdateHabitMetricInput extends PartialType(
  CreateHabitMetricInput
) {
  @Field(() => String)
  id: string;
}
