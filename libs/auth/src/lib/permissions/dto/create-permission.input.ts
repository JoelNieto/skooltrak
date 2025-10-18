import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreatePermissionInput
  implements Prisma.PermissionUncheckedCreateInput
{
  @Field(() => String)
  descriptiveId: string;

  @Field(() => String)
  description: string;
}
