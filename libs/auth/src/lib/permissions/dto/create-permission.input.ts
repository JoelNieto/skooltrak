import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreatePermissionInput
  implements Prisma.PermissionUncheckedCreateInput
{
  @Field(() => String)
  descriptiveId: string;

  @Field(() => String)
  description: string;
}
