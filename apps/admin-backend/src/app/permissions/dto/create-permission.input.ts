import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreatePermissionInput
  implements Prisma.PermissionUncheckedCreateInput
{
  @Field(() => String, { description: 'Descriptive ID of the permission' })
  descriptiveId: string;
  @Field(() => String, { description: 'Description of the permission' })
  description: string;
}
