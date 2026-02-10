import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Parent
  implements
    Omit<Prisma.ParentGetPayload<{ include: { students: true } }>, 'students'>
{
  @Field(() => String, { description: 'ID of the parent' })
  id: string;

  @Field(() => String, { description: 'First name of the parent' })
  firstName: string;

  @Field(() => String, { description: 'Middle name of the parent' })
  middleName: string;

  @Field(() => String, { description: 'Father name (paternal last name) of the parent' })
  fatherName: string;

  @Field(() => String, { description: 'Mother name (maternal last name) of the parent' })
  motherName: string;

  @Field(() => String, { description: 'Document ID of the parent' })
  documentId: string;

  @Field(() => String, { description: 'Phone number of the parent' })
  phone: string;

  @Field(() => String, { description: 'Email of the parent' })
  email: string;

  @Field(() => String, { description: 'Relationship to student (Father, Mother, Guardian, etc.)' })
  relationship: string;

  @Field(() => String, { description: 'Occupation of the parent' })
  occupation: string;

  @Field(() => String, { description: 'Work phone number of the parent' })
  workPhone: string;

  @Field(() => String, { description: 'Address of the parent' })
  address: string;

  @Field(() => String, { description: 'Organization ID of the parent' })
  organizationId: string;

  @Field(() => String, { nullable: true, description: 'User ID linked to this parent' })
  userId: string | null;

  // Students relation is omitted to avoid circular dependency
  // Access students through the parentsByStudentId query instead
  students: any[];

  @Field(() => Date, { description: 'Created at timestamp' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at timestamp' })
  updatedAt: Date;
}
