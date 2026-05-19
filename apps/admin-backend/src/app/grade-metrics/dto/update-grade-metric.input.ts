import { PartialType } from '@nestjs/swagger';
import { CreateGradeMetricInput } from './create-grade-metric.input';

export class UpdateGradeMetricInput extends PartialType(
  CreateGradeMetricInput
) {
    id: string;
}
