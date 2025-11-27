import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateUserInput implements Prisma.UserUncheckedCreateInput {
  @Field(() => String, { description: 'Email of the user' })
  email: string;
  @Field(() => String, { description: 'First name of the user' })
  firstName: string;
  @Field(() => String, { description: 'Last name of the user' })
  lastName: string;
  @Field(() => String, { description: 'Password of the user' })
  password: string;
  @Field(() => String, { description: 'Role ID of the user' })
  roleId: string;
  @Field(() => String, {
    description: 'Organization ID of the user',
    nullable: true,
  })
  organizationId: string;
}
