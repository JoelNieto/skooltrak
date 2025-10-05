import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
export class Organization implements Prisma.OrganizationCreateInput {
  @Field(() => String, {
    description: 'ID of the organization (auto-generated)',
  })
  id?: string;
  @Field(() => String, { description: 'Name of the organization' })
  name: string;
  @Field(() => String, { description: 'Short name of the organization' })
  shortName: string;
  @Field(() => String, { description: 'Logo of the organization' })
  logo: string;
  @Field(() => String, { description: 'Address of the organization' })
  address: string;
  @Field(() => String, { description: 'City of the organization' })
  city: string;
  @Field(() => String, { description: 'State of the organization' })
  state: string;
  @Field(() => String, { description: 'Zip code of the organization' })
  zip: string;
  @Field(() => String, { description: 'Country of the organization' })
  country: string;
  @Field(() => String, { description: 'Email of the organization' })
  email: string;
  @Field(() => String, { description: 'Phone number of the organization' })
  phone: string;
  @Field(() => String, { description: 'Website of the organization' })
  website: string;
  @Field(() => [School], { description: 'Schools of the organization' })
  schools?: Prisma.SchoolCreateNestedManyWithoutOrganizationInput;
  @Field(() => Date, { description: 'Created at' })
  createdAt?: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt?: Date;
}
