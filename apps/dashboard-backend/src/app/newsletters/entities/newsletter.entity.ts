import { Organization, User } from '@/auth';
import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
export class Newsletter
  implements
    Prisma.NewsletterGetPayload<{
      include: { organization: true; school: true; author: true };
    }>
{
  @Field(() => String, { description: 'ID of the newsletter' })
  id: string;

  @Field(() => String, { description: 'Title of the newsletter' })
  title: string;

  @Field(() => String, { description: 'Content of the newsletter (HTML)' })
  content: string;

  @Field(() => Boolean, { description: 'Whether the newsletter is published' })
  published: boolean;

  @Field(() => Date, { nullable: true, description: 'Date when the newsletter was published' })
  publishedAt: Date | null;

  @Field(() => Organization, { description: 'Organization of the newsletter' })
  organization: Organization;

  @Field(() => String, { description: 'Organization ID' })
  organizationId: string;

  @Field(() => School, { description: 'School of the newsletter' })
  school: School;

  @Field(() => String, { description: 'School ID' })
  schoolId: string;

  @Field(() => User, { description: 'Author of the newsletter' })
  author: User;

  @Field(() => String, { description: 'Author user ID' })
  authorId: string;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
