import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { Role } from '../../roles/entities/role.entity';
import { School } from '../../schools/entities/school.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Organization implements Prisma.OrganizationCreateInput {
  @Field(() => String, {
    description: 'ID of the organization (auto-generated)',
  })
  id: string;
  @Field(() => String, { description: 'Name of the organization' })
  name: string;
  @Field(() => Boolean, { description: 'Active status of the organization' })
  active?: boolean;
  @Field(() => [User], { description: 'Users of the organization' })
  users?: Prisma.UserCreateNestedManyWithoutOrganizationInput;
  @Field(() => [Role], { description: 'Roles of the organization' })
  roles?: Prisma.RoleCreateNestedManyWithoutOrganizationInput;
  @Field(() => [School], { description: 'Schools of the organization' })
  School?: Prisma.SchoolCreateNestedManyWithoutOrganizationInput;
  @Field(() => [Subject], { description: 'Subjects of the organization' })
  Subject?: Prisma.SubjectCreateNestedManyWithoutOrganizationInput;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
