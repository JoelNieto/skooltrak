import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
export class Subject implements Prisma.SubjectCreateInput {
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
  organization: Prisma.OrganizationCreateNestedOneWithoutSubjectInput;
  @Field(() => School, { description: 'School of the subject' })
  school: Prisma.SchoolCreateNestedOneWithoutSubjectsInput;
}
