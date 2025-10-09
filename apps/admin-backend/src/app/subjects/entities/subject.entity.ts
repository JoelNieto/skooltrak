import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';

@ObjectType()
export class Subject implements Prisma.SubjectGetPayload<true> {
  schoolId: string;
  @Field(() => String, { description: 'ID of the subject (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
  @Field(() => Organization, { description: 'Organization of the subject' })
  organization: {
    id: string;
    description: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
  };
  @Field(() => String, { description: 'ID of the organization' })
  organizationId: string;
}
