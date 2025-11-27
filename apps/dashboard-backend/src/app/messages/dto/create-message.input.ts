import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateMessageInput implements Prisma.MessageUncheckedCreateInput {
  @Field(() => String, { description: 'The subject of the message.' })
  subject: string;

  @Field(() => String, { description: 'The content of the message.' })
  content: string;

  @Field(() => String, {
    description: 'The ID of the organization associated with the message.',
  })
  organizationId: string;

  @Field(() => [String], {
    description: 'The IDs of the recipients associated with the message.',
  })
  recipientIds: string[];
}
