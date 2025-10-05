import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Organization } from '../../organizations/entities/organization.entity';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
export class Subject implements Prisma.SubjectCreateInput {
  @Field(() => String, { description: 'ID of the subject (auto-generated)' })
  id?: string;
  @Field(() => Organization, { description: 'Organization ID' })
  organization: Prisma.OrganizationCreateNestedOneWithoutSubjectInput;
  @Field(() => School, { description: 'School ID' })
  school: Prisma.SchoolCreateNestedOneWithoutSubjectsInput;
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Created at' })
  createdAt?: string | Date;
  @Field(() => String)
  updatedAt?: string | Date;
  @Field(() => String, { description: 'School ID' })
  schoolId: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
}
