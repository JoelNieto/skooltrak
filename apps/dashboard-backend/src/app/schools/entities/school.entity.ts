import { Organization } from '@/auth';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class School {
  @Field(() => String, { description: 'ID of the school' })
  id: string;
  @Field(() => Organization, { description: 'Organization of the school' })
  organization: Organization;
  @Field(() => String, {
    description: 'URL slug for public store routes',
    nullable: true,
  })
  slug: string | null;
  @Field(() => String, { description: 'Name of the school' })
  name: string;
  @Field(() => String, { description: 'Organization ID of the school' })
  organizationId: string;
  @Field(() => String, { description: 'Short name of the school' })
  shortName: string;
  @Field(() => String, { description: 'Logo storage key of the school' })
  logo: string;
  @Field(() => String, {
    description: 'Presigned URL for the school logo',
    nullable: true,
  })
  logoUrl?: string;
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
  @Field(() => String, {
    description: 'Primary brand color (hex, e.g. #3b82f6)',
    nullable: true,
  })
  primaryColor: string | null;
  @Field(() => String, {
    description: 'Secondary brand color (hex)',
    nullable: true,
  })
  secondaryColor: string | null;
  @Field(() => String, {
    description: 'Tertiary/accent brand color (hex)',
    nullable: true,
  })
  tertiaryColor: string | null;
  @Field(() => String, { description: 'Currency code (e.g. USD, MXN)' })
  currencyCode: string;
  @Field(() => Number, { description: 'Current year of the school' })
  currentYear: number;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
