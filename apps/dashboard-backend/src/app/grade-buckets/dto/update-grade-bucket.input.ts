import { PartialType } from '@nestjs/swagger';
import { CreateGradeBucketInput } from './create-grade-bucket.input';

export class UpdateGradeBucketInput extends PartialType(
  CreateGradeBucketInput
) {
    id: string;
}
