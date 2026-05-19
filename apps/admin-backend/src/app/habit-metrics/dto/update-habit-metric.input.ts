import { PartialType } from '@nestjs/swagger';
import { CreateHabitMetricInput } from './create-habit-metric.input';

export class UpdateHabitMetricInput extends PartialType(
  CreateHabitMetricInput
) {
    id: string;
}
