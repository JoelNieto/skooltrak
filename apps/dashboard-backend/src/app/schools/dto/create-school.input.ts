import { Prisma } from '@generated/prisma';
import { Field, InputType, Int } from '@nestjs/graphql';

type CreateSchoolInputType = Omit<Prisma.SchoolUncheckedCreateInput, 'organizationId'> & {
  organizationId?: string;
};
@InputType()
export class CreateSchoolInput implements CreateSchoolInputType {
  @Field(() => String, {
    description: 'Organization ID of the school',
    nullable: true,
  })
  organizationId?: string;

  @Field(() => String, { description: 'Name of the school', nullable: false })
  name: string;
  @Field(() => String, {
    description: 'Short name of the school',
    nullable: false,
  })
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
  @Field(() => String, {
    description: 'Phone number of the school',
    defaultValue: '',
  })
  phone: string;
  @Field(() => String, {
    description: 'Website of the school',
    defaultValue: '',
  })
  website: string;

  @Field(() => String, {
    description: 'Primary brand color (hex, e.g. #3b82f6)',
    nullable: true,
  })
  primaryColor?: string | null;
  @Field(() => String, {
    description: 'Secondary brand color (hex)',
    nullable: true,
  })
  secondaryColor?: string | null;
  @Field(() => String, {
    description: 'Tertiary/accent brand color (hex)',
    nullable: true,
  })
  tertiaryColor?: string | null;

  @Field(() => Int, {
    description: 'Current year of the school',
    defaultValue: 2025,
  })
  currentYear: number;
}
