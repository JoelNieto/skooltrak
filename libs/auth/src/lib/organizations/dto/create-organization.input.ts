import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateOrganizationInput
  implements Prisma.OrganizationUncheckedCreateInput
{
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => Boolean, { nullable: true })
  active?: boolean | undefined;
}
