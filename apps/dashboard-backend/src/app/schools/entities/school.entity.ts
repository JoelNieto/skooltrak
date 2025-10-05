import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Course } from '../../courses/entities/course.entity';
import { Degree } from '../../degrees/entities/degree.entity';

import { Organization } from '../../organizations/entities/organization.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@ObjectType()
export class School implements Prisma.SchoolCreateInput {
  @Field(() => Organization, { description: 'Organization of the school' })
  organization: Prisma.OrganizationCreateNestedOneWithoutSchoolInput;

  @Field(() => String, { description: 'ID of the school (auto-generated)' })
  id?: string;
  @Field(() => String, { description: 'Name of the school' })
  name: string;
  @Field(() => String, { description: 'Short name of the school' })
  shortName: string;
  @Field(() => String, { description: 'Logo of the school' })
  logo: string;
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
  @Field(() => [Subject], { description: 'Subjects of the school' })
  subjects?: Prisma.SubjectCreateNestedManyWithoutSchoolInput;
  @Field(() => [StudyPlan], { description: 'Study plans of the school' })
  studyPlans?: Prisma.StudyPlanCreateNestedManyWithoutSchoolInput;
  @Field(() => [Degree], { description: 'Degrees of the school' })
  degrees?: Prisma.DegreeCreateNestedManyWithoutSchoolInput;
  @Field(() => [Course], { description: 'Courses of the school' })
  courses?: Prisma.CourseCreateNestedManyWithoutSchoolInput;
  @Field(() => Date, { description: 'Created at' })
  createdAt?: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt?: Date;
}
