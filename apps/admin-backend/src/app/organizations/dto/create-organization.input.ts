import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateOrganizationInput
  implements Prisma.OrganizationUncheckedCreateInput
{
  @Field(() => String, { description: 'Name of the organization' })
  name: string;
  @Field(() => String, { description: 'Description of the organization' })
  description: string;
  @Field(() => Boolean, {
    description: 'Active status of the organization',
    defaultValue: true,
  })
  active?: boolean;
}
