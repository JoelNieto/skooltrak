import { Organization } from '@/auth';
import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class Subject
  implements Prisma.SubjectGetPayload<{ include: { organization: true } }>
{
  @Field(() => String, { description: 'ID of the subject (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'Short name of the subject' })
  shortName: string;
  @Field(() => String, { description: 'Code of the subject' })
  code: string;
  @Field(() => String, { description: 'Name of the subject' })
  name: string;
  @Field(() => Organization, { description: 'Organization of the subject' })
  organization: Organization;
  @Field(() => String, { description: 'Organization ID of the subject' })
  organizationId: string;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
