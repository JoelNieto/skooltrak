import { Organization } from '@/auth';
import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class School
  implements
    Prisma.SchoolGetPayload<{
      include: {
        organization: true;
      };
    }>
{
  @Field(() => String, { description: 'ID of the school' })
  id: string;
  @Field(() => Organization, { description: 'Organization of the school' })
  organization: Organization;
  @Field(() => String, { description: 'Name of the school' })
  name: string;
  @Field(() => String, { description: 'Organization ID of the school' })
  organizationId: string;
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
  @Field(() => String, { description: 'Phone number of the school' })
  phone: string;
  @Field(() => String, { description: 'Website of the school' })
  website: string;
  @Field(() => Number, { description: 'Current year of the school' })
  currentYear: number;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
