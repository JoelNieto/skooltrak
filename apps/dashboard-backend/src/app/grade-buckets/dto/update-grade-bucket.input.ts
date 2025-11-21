import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateGradeBucketInput } from './create-grade-bucket.input';

@InputType()
export class UpdateGradeBucketInput extends PartialType(
  CreateGradeBucketInput
) {
  @Field(() => String)
  id: string;
}
