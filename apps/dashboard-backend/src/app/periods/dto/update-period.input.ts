import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreatePeriodInput } from './create-period.input';

@InputType()
export class UpdatePeriodInput extends PartialType(CreatePeriodInput) {
  @Field(() => String, { description: 'ID of the period' })
  id: string;
}
