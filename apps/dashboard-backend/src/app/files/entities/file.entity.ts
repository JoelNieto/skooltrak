import { $Enums, Prisma } from '@generated/prisma';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '@/auth';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { School } from '../../schools/entities/school.entity';

@ObjectType()
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
  @Field(() => String, { description: 'ID of the file' })
  id: string;

  @Field(() => String, { description: 'Organization ID of the file' })
  organizationId: string;

  @Field(() => String, { description: 'Owner ID of the file' })
  ownerId: string;

  @Field(() => User, { description: 'Owner of the file' })
  owner: User;

  @Field(() => String, { description: 'Name of the file' })
  name: string;

  @Field(() => String, { description: 'MIME type of the file' })
  mimeType: string;

  @Field(() => Int, { description: 'Size of the file in bytes' })
  size: number;

  @Field(() => String, { description: 'Storage key for the file' })
  storageKey: string;

  @Field(() => [FileShareUser], { description: 'User shares for the file' })
  sharesUsers: FileShareUser[];

  @Field(() => [FileShareSchool], {
    description: 'School shares for the file',
  })
  sharesSchools: FileShareSchool[];

  @Field(() => [FileShareClassGroup], {
    description: 'Class group shares for the file',
  })
  sharesClassGroups: FileShareClassGroup[];

  @Field(() => [FileShareCourse], { description: 'Course shares for the file' })
  sharesCourses: FileShareCourse[];

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;

  @Field(() => Date, { description: 'Deleted at', nullable: true })
  deletedAt: Date | null;

  @Field(() => String, {
    description: 'Effective access for the current user',
    nullable: true,
  })
  access?: $Enums.FilePermission | null;
}

@ObjectType()
export class FileShareUser
  implements Prisma.FileShareUserGetPayload<{ include: { user: true } }>
{
  @Field(() => String, { description: 'ID of the file share' })
  id: string;

  @Field(() => String, { description: 'File ID of the share' })
  fileId: string;

  @Field(() => String, { description: 'User ID of the share' })
  userId: string;

  @Field(() => User, { description: 'User for the share' })
  user: User;

  @Field(() => String, { description: 'Permission for the share' })
  permission: $Enums.FilePermission;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}

@ObjectType()
export class FileShareSchool
  implements Prisma.FileShareSchoolGetPayload<{ include: { school: true } }>
{
  @Field(() => String, { description: 'ID of the file share' })
  id: string;

  @Field(() => String, { description: 'File ID of the share' })
  fileId: string;

  @Field(() => String, { description: 'School ID of the share' })
  schoolId: string;

  @Field(() => School, { description: 'School for the share' })
  school: School;

  @Field(() => String, { description: 'Permission for the share' })
  permission: $Enums.FilePermission;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}

@ObjectType()
export class FileShareClassGroup
  implements
    Prisma.FileShareClassGroupGetPayload<{ include: { classGroup: true } }>
{
  @Field(() => String, { description: 'ID of the file share' })
  id: string;

  @Field(() => String, { description: 'File ID of the share' })
  fileId: string;

  @Field(() => String, { description: 'Class group ID of the share' })
  classGroupId: string;

  @Field(() => ClassGroup, { description: 'Class group for the share' })
  classGroup: ClassGroup;

  @Field(() => String, { description: 'Permission for the share' })
  permission: $Enums.FilePermission;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}

@ObjectType()
export class FileShareCourse
  implements Prisma.FileShareCourseGetPayload<{ include: { course: true } }>
{
  @Field(() => String, { description: 'ID of the file share' })
  id: string;

  @Field(() => String, { description: 'File ID of the share' })
  fileId: string;

  @Field(() => String, { description: 'Course ID of the share' })
  courseId: string;

  @Field(() => Course, { description: 'Course for the share' })
  course: Course;

  @Field(() => String, { description: 'Permission for the share' })
  permission: $Enums.FilePermission;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
