import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateUserInput implements Prisma.UserUncheckedCreateInput {
  @Field(() => String, { description: 'Email of the user' })
  email: string;
  @Field(() => String, { description: 'Name of the user' })
  name: string;
  @Field(() => String, { description: 'Role ID of the user' })
  roleId: string;
  @Field(() => String, { description: 'Organization ID of the user' })
  organizationId: string;
}
