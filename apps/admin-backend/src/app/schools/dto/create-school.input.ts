import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateSchoolInput implements Prisma.SchoolUncheckedCreateInput {
  @Field(() => String, { description: 'Organization ID of the school' })
  organizationId: string;
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
}
