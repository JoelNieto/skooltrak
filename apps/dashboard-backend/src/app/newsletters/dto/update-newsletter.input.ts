import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateNewsletterInput } from './create-newsletter.input';

@InputType()
export class UpdateNewsletterInput extends PartialType(CreateNewsletterInput) {
  @Field(() => String)
  id: string;
}
