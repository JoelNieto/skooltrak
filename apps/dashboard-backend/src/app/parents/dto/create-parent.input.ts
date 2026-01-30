import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

type CreateParentInputType = Omit<Prisma.ParentUncheckedCreateInput, 'students'> & {
  studentIds?: string[];
};

@InputType()
export class CreateParentInput implements CreateParentInputType {
  @Field(() => String, { description: 'First name of the parent' })
  firstName: string;

  @Field(() => String, { description: 'Middle name of the parent', defaultValue: '' })
  middleName: string;

  @Field(() => String, { description: 'Father name (paternal last name) of the parent' })
  fatherName: string;

  @Field(() => String, { description: 'Mother name (maternal last name) of the parent', defaultValue: '' })
  motherName: string;

  @Field(() => String, { description: 'Document ID of the parent' })
  documentId: string;

  @Field(() => String, { description: 'Phone number of the parent' })
  phone: string;

  @Field(() => String, { description: 'Email of the parent' })
  email: string;

  @Field(() => String, { description: 'Relationship to student (Father, Mother, Guardian, etc.)' })
  relationship: string;

  @Field(() => String, { description: 'Occupation of the parent', defaultValue: '' })
  occupation: string;

  @Field(() => String, { description: 'Work phone number of the parent', defaultValue: '' })
  workPhone: string;

  @Field(() => String, { description: 'Address of the parent', defaultValue: '' })
  address: string;

  @Field(() => String, { description: 'Organization ID of the parent' })
  organizationId: string;

  @Field(() => [String], { description: 'IDs of students to associate with this parent', nullable: true })
  studentIds?: string[];
}
