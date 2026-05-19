import { User } from '@/auth';
import { $Enums, Prisma } from '@generated/prisma';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Subject } from '../../subjects/entities/subject.entity';

export class Teacher
  implements
    Prisma.TeacherGetPayload<{
      include: { user: true; courses: true; classGroups: true; subjects: true };
    }>
{
    id: string;
    firstName: string;
    middleName: string;
    fatherName: string;
    motherName: string;
    documentId: string;
    organizationId: string;
    birthDate: Date;
    gender: $Enums.Gender;
    userId: string | null;
    courses: Course[];

    classGroups: ClassGroup[];

    subjects: Subject[];

    address: string;
    phoneNumber: string;
    personalEmail: string;
    about: string;
    teacherSince: number | null;
    memberSince: Date | null;
    user: User | null;
    createdAt: Date;
    updatedAt: Date;
}
