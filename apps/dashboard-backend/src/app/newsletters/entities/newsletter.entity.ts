import { Organization, User } from '@/auth';
import { Prisma } from '@generated/prisma';
import { School } from '../../schools/entities/school.entity';

export class Newsletter
  implements
    Prisma.NewsletterGetPayload<{
      include: { organization: true; school: true; author: true };
    }>
{
    id: string;

    title: string;

    content: string;

    published: boolean;

    publishedAt: Date | null;

    organization: Organization;

    organizationId: string;

    school: School;

    schoolId: string;

    author: User;

    authorId: string;

    createdAt: Date;

    updatedAt: Date;
}
