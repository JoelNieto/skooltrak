import { Organization } from '@/auth';
import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class School
  implements Prisma.SchoolGetPayload<{ include: { organization: true } }>
{
  @Field(() => String, { description: 'ID of the school (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Name of the school' })
  name: string;
  @Field(() => String, { description: 'Short name of the school' })
  shortName: string;
  @Field(() => String, { description: 'Logo of the school' })
  logo: string;
  @Field(() => String, { description: 'Address of the school' })
  address: string;
  @Field(() => String, { description: 'City of the school' })
  city: string;
  @Field(() => String, { description: 'State of the school' })
  state: string;
  @Field(() => String, { description: 'Zip code of the school' })
  zip: string;
  @Field(() => String, { description: 'Country of the school' })
  country: string;
  @Field(() => String, { description: 'Email of the school' })
  email: string;
  @Field(() => String, { description: 'Phone of the school' })
  phone: string;
  @Field(() => String, { description: 'Website of the school' })
  website: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
  @Field(() => Organization, { description: 'Organization of the school' })
  organization: Organization;
  @Field(() => String, { description: 'ID of the organization' })
  organizationId: string;
}
