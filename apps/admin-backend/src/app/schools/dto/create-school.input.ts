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
  @Field(() => String, { description: 'Logo of the school', defaultValue: '' })
  logo: string;
  @Field(() => String, {
    description: 'Address of the school',
    defaultValue: '',
  })
  address: string;
  @Field(() => String, { description: 'City of the school', defaultValue: '' })
  city: string;
  @Field(() => String, { description: 'State of the school', defaultValue: '' })
  state: string;
  @Field(() => String, {
    description: 'Zip code of the school',
    defaultValue: '',
  })
  zip: string;
  @Field(() => String, {
    description: 'Country of the school',
    defaultValue: '',
  })
  country: string;
  @Field(() => String, { description: 'Email of the school', defaultValue: '' })
  email: string;
  @Field(() => String, { description: 'Phone of the school', defaultValue: '' })
  phone: string;
  @Field(() => String, {
    description: 'Website of the school',
    defaultValue: '',
  })
  website: string;
}
