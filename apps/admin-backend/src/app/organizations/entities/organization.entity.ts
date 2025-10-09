import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { School } from '../../schools/entities/school.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@ObjectType()
export class Organization implements Prisma.OrganizationGetPayload<false> {
  @Field(() => [School], { description: 'Schools of the organization' })
  schools: School[];
  @Field(() => [Subject], { description: 'Subjects of the organization' })
  subjects: Subject[];
  @Field(() => String, {
    description: 'ID of the organization (auto-generated)',
  })
  id: string;
  @Field(() => String, { description: 'Name of the organization' })
  name: string;
  @Field(() => String, { description: 'Description of the organization' })
  description: string;
  @Field(() => Boolean, { description: 'Active status of the organization' })
  active: boolean;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
