import { $Enums, Prisma } from '@generated/prisma';
import { User } from '@/auth';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { School } from '../../schools/entities/school.entity';

export class File
  implements
    Prisma.FileGetPayload<{
      include: {
        owner: true;
        sharesUsers: { include: { user: true } };
        sharesSchools: { include: { school: true } };
        sharesClassGroups: { include: { classGroup: true } };
        sharesCourses: { include: { course: true } };
      };
    }>
{
    id: string;

    organizationId: string;

    ownerId: string;

    owner: User;

    name: string;

    mimeType: string;

    size: number;

    storageKey: string;

    sharesUsers: FileShareUser[];

    sharesSchools: FileShareSchool[];

    sharesClassGroups: FileShareClassGroup[];

    sharesCourses: FileShareCourse[];

    createdAt: Date;

    updatedAt: Date;

    deletedAt: Date | null;

    access?: $Enums.FilePermission | null;
}

export class FileShareUser
  implements Prisma.FileShareUserGetPayload<{ include: { user: true } }>
{
    id: string;

    fileId: string;

    userId: string;

    user: User;

    permission: $Enums.FilePermission;

    createdAt: Date;

    updatedAt: Date;
}

export class FileShareSchool
  implements Prisma.FileShareSchoolGetPayload<{ include: { school: true } }>
{
    id: string;

    fileId: string;

    schoolId: string;

    school: School;

    permission: $Enums.FilePermission;

    createdAt: Date;

    updatedAt: Date;
}

export class FileShareClassGroup
  implements
    Prisma.FileShareClassGroupGetPayload<{ include: { classGroup: true } }>
{
    id: string;

    fileId: string;

    classGroupId: string;

    classGroup: ClassGroup;

    permission: $Enums.FilePermission;

    createdAt: Date;

    updatedAt: Date;
}

export class FileShareCourse
  implements Prisma.FileShareCourseGetPayload<{ include: { course: true } }>
{
    id: string;

    fileId: string;

    courseId: string;

    course: Course;

    permission: $Enums.FilePermission;

    createdAt: Date;

    updatedAt: Date;
}
