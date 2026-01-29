import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { $Enums, Prisma } from '@generated/prisma';
import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateFileInput } from './dto/create-file.input';

import { CreateFileUploadInput } from './dto/create-file-upload.input';
import { FetchCourseFilesInput } from './dto/fetch-course-files.input';
import { RemoveShareInput } from './dto/remove-share.input';
import { FileShareTargetType, ShareFileInput } from './dto/share-file.input';
import { UpdateShareInput } from './dto/update-share.input';

type AccessContext = {
  schoolIds: string[];
  classGroupIds: string[];
  courseIds: string[];
};

type AuthUserContext = {
  userId: string;
  organizationId?: string | null;
};

@Injectable({ scope: Scope.REQUEST })
export class FilesService {
  private readonly fileInclude: Prisma.FileInclude = {
    owner: true,
    sharesUsers: { include: { user: true } },
    sharesSchools: { include: { school: true } },
    sharesClassGroups: { include: { classGroup: true } },
    sharesCourses: { include: { course: true } },
  };
  private readonly s3Client: S3Client;
  private readonly r2Bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {
    const endpoint = this.getRequiredConfig('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.getRequiredConfig('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredConfig(
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY'
    );
    this.r2Bucket = this.getRequiredConfig('CLOUDFLARE_R2_BUCKET');
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  create(createFileInput: CreateFileInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    return this.prisma.file.create({
      data: {
        ...createFileInput,
        ownerId: userId,
        organizationId,
      },
      include: this.fileInclude,
    });
  }

  async findAccessible(query: FetchDataInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const orConditions: Prisma.FileWhereInput[] = [
      { ownerId: userId },
      { sharesUsers: { some: { userId } } },
    ];

    if (accessContext.schoolIds.length > 0) {
      orConditions.push({
        sharesSchools: { some: { schoolId: { in: accessContext.schoolIds } } },
      });
    }

    if (accessContext.classGroupIds.length > 0) {
      orConditions.push({
        sharesClassGroups: {
          some: { classGroupId: { in: accessContext.classGroupIds } },
        },
      });
    }

    if (accessContext.courseIds.length > 0) {
      orConditions.push({
        sharesCourses: { some: { courseId: { in: accessContext.courseIds } } },
      });
    }

    const orderByField = query.orderBy ?? 'createdAt';
    const orderDirection = query.orderDirection ?? 'desc';

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: orConditions,
        name: query.search
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      skip: query.skip,
      take: query.take,
      orderBy: { [orderByField]: orderDirection },
      include: this.fileInclude,
    });

    return files.map((file) => ({
      ...file,
      access: this.resolvePermission(file, userId, accessContext),
    }));
  }

  async findOwned(query: FetchDataInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const orderByField = query.orderBy ?? 'createdAt';
    const orderDirection = query.orderDirection ?? 'desc';

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ownerId: userId,
        name: query.search
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      skip: query.skip,
      take: query.take,
      orderBy: { [orderByField]: orderDirection },
      include: this.fileInclude,
    });

    return files.map((file) => ({
      ...file,
      access: $Enums.FilePermission.EDIT,
    }));
  }

  async findSharedWithMe(query: FetchDataInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const orConditions: Prisma.FileWhereInput[] = [
      { sharesUsers: { some: { userId } } },
    ];

    if (accessContext.schoolIds.length > 0) {
      orConditions.push({
        sharesSchools: { some: { schoolId: { in: accessContext.schoolIds } } },
      });
    }

    if (accessContext.classGroupIds.length > 0) {
      orConditions.push({
        sharesClassGroups: {
          some: { classGroupId: { in: accessContext.classGroupIds } },
        },
      });
    }

    if (accessContext.courseIds.length > 0) {
      orConditions.push({
        sharesCourses: { some: { courseId: { in: accessContext.courseIds } } },
      });
    }

    const orderByField = query.orderBy ?? 'createdAt';
    const orderDirection = query.orderDirection ?? 'desc';

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ownerId: { not: userId },
        OR: orConditions,
        name: query.search
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      skip: query.skip,
      take: query.take,
      orderBy: { [orderByField]: orderDirection },
      include: this.fileInclude,
    });

    return files.map((file) => ({
      ...file,
      access: this.resolvePermission(file, userId, accessContext),
    }));
  }

  async findByCourse(query: FetchCourseFilesInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const orConditions: Prisma.FileWhereInput[] = [
      { ownerId: userId },
      { sharesUsers: { some: { userId } } },
    ];

    if (accessContext.schoolIds.length > 0) {
      orConditions.push({
        sharesSchools: { some: { schoolId: { in: accessContext.schoolIds } } },
      });
    }

    if (accessContext.classGroupIds.length > 0) {
      orConditions.push({
        sharesClassGroups: {
          some: { classGroupId: { in: accessContext.classGroupIds } },
        },
      });
    }

    if (accessContext.courseIds.length > 0) {
      orConditions.push({
        sharesCourses: { some: { courseId: { in: accessContext.courseIds } } },
      });
    }

    const orderByField = query.orderBy ?? 'createdAt';
    const orderDirection = query.orderDirection ?? 'desc';

    const files = await this.prisma.file.findMany({
      where: {
        organizationId,
        deletedAt: null,
        sharesCourses: { some: { courseId: query.courseId } },
        OR: orConditions,
        name: query.search
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      skip: query.skip,
      take: query.take,
      orderBy: { [orderByField]: orderDirection },
      include: this.fileInclude,
    });

    return files.map((file) => ({
      ...file,
      access: this.resolvePermission(file, userId, accessContext),
    }));
  }

  async createUploadUrl(input: CreateFileUploadInput) {
    const { organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const course = await this.prisma.course.findFirst({
      where: { id: input.courseId, organizationId },
      select: { id: true },
    });

    if (!course) {
      throw new ForbiddenException('Course not found in organization.');
    }

    const storageKey = this.buildStorageKey(input.courseId, input.fileName);
    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: storageKey,
      ContentType: input.mimeType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60,
    });

    return { uploadUrl, storageKey };
  }

  async createDownloadUrl(input: { fileId: string }) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(input.fileId, organizationId);
    const access = this.resolvePermission(file, userId, accessContext);

    if (!access) {
      throw new ForbiddenException('You do not have access to this file.');
    }

    const safeFileName = file.name.replace(/"/g, '');
    const command = new GetObjectCommand({
      Bucket: this.r2Bucket,
      Key: file.storageKey,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
    });
    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60,
    });

    return { downloadUrl };
  }

  async findOne(id: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(id, organizationId);
    const access = this.resolvePermission(file, userId, accessContext);

    if (!access) {
      throw new ForbiddenException('You do not have access to this file.');
    }

    return { ...file, access };
  }

  async share(shareFileInput: ShareFileInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(shareFileInput.fileId, organizationId);
    this.ensureCanEdit(file, userId, accessContext);

    await this.ensureShareTargetInOrganization(
      shareFileInput.targetType,
      shareFileInput.targetId,
      organizationId
    );

    await this.upsertShare(shareFileInput);

    return this.loadFileWithAccess(shareFileInput.fileId, organizationId);
  }

  async updateShare(updateShareInput: UpdateShareInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(updateShareInput.fileId, organizationId);
    this.ensureCanEdit(file, userId, accessContext);

    await this.ensureShareTargetInOrganization(
      updateShareInput.targetType,
      updateShareInput.targetId,
      organizationId
    );

    await this.updateShareRecord(updateShareInput);

    return this.loadFileWithAccess(updateShareInput.fileId, organizationId);
  }

  async removeShare(removeShareInput: RemoveShareInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(removeShareInput.fileId, organizationId);
    this.ensureCanEdit(file, userId, accessContext);

    await this.removeShareRecord(removeShareInput);

    return this.loadFileWithAccess(removeShareInput.fileId, organizationId);
  }

  private getUserContext() {
    const { req } = this.context;
    const { userId, organizationId } = req.user as AuthUserContext;
    return { userId, organizationId };
  }

  private getRequiredConfig(key: string) {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new ForbiddenException(`Missing configuration: ${key}`);
    }
    return value;
  }

  private buildStorageKey(courseId: string, fileName: string) {
    const safeName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `courses/${courseId}/${timestamp}-${safeName}`;
  }

  private async loadFileWithAccess(fileId: string, organizationId: string) {
    const { userId } = this.getUserContext();
    const accessContext = await this.getAccessContext(userId);
    const file = await this.getFileOrThrow(fileId, organizationId);
    return { ...file, access: this.resolvePermission(file, userId, accessContext) };
  }

  private async getFileOrThrow(id: string, organizationId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: this.fileInclude,
    });

    if (!file) {
      throw new ForbiddenException('File not found.');
    }

    return file;
  }

  private async getAccessContext(userId: string): Promise<AccessContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          select: {
            schoolId: true,
            classGroupId: true,
            courses: { select: { id: true } },
          },
        },
        teacher: {
          select: {
            classGroups: { select: { id: true, schoolId: true } },
            courses: { select: { id: true, schoolId: true } },
          },
        },
      },
    });

    const schoolIds = new Set<string>();
    const classGroupIds = new Set<string>();
    const courseIds = new Set<string>();

    if (user?.student) {
      schoolIds.add(user.student.schoolId);
      classGroupIds.add(user.student.classGroupId);
      user.student.courses.forEach((course) => courseIds.add(course.id));
    }

    if (user?.teacher) {
      user.teacher.classGroups.forEach((group) => {
        classGroupIds.add(group.id);
        schoolIds.add(group.schoolId);
      });
      user.teacher.courses.forEach((course) => {
        courseIds.add(course.id);
        schoolIds.add(course.schoolId);
      });
    }

    return {
      schoolIds: Array.from(schoolIds),
      classGroupIds: Array.from(classGroupIds),
      courseIds: Array.from(courseIds),
    };
  }

  private resolvePermission(
    file: Prisma.FileGetPayload<{
      include: {
        sharesUsers: true;
        sharesSchools: true;
        sharesClassGroups: true;
        sharesCourses: true;
      };
    }>,
    userId: string,
    accessContext: AccessContext
  ) {
    if (file.ownerId === userId) {
      return $Enums.FilePermission.EDIT;
    }

    const schoolIds = new Set(accessContext.schoolIds);
    const classGroupIds = new Set(accessContext.classGroupIds);
    const courseIds = new Set(accessContext.courseIds);

    const hasEdit =
      file.sharesUsers.some(
        (share) =>
          share.userId === userId &&
          share.permission === $Enums.FilePermission.EDIT
      ) ||
      file.sharesSchools.some(
        (share) =>
          schoolIds.has(share.schoolId) &&
          share.permission === $Enums.FilePermission.EDIT
      ) ||
      file.sharesClassGroups.some(
        (share) =>
          classGroupIds.has(share.classGroupId) &&
          share.permission === $Enums.FilePermission.EDIT
      ) ||
      file.sharesCourses.some(
        (share) =>
          courseIds.has(share.courseId) &&
          share.permission === $Enums.FilePermission.EDIT
      );

    if (hasEdit) {
      return $Enums.FilePermission.EDIT;
    }

    const hasView =
      file.sharesUsers.some(
        (share) =>
          share.userId === userId &&
          share.permission === $Enums.FilePermission.VIEW
      ) ||
      file.sharesSchools.some(
        (share) =>
          schoolIds.has(share.schoolId) &&
          share.permission === $Enums.FilePermission.VIEW
      ) ||
      file.sharesClassGroups.some(
        (share) =>
          classGroupIds.has(share.classGroupId) &&
          share.permission === $Enums.FilePermission.VIEW
      ) ||
      file.sharesCourses.some(
        (share) =>
          courseIds.has(share.courseId) &&
          share.permission === $Enums.FilePermission.VIEW
      );

    return hasView ? $Enums.FilePermission.VIEW : null;
  }

  private ensureCanEdit(
    file: Prisma.FileGetPayload<{
      include: {
        sharesUsers: true;
        sharesSchools: true;
        sharesClassGroups: true;
        sharesCourses: true;
      };
    }>,
    userId: string,
    accessContext: AccessContext
  ) {
    const access = this.resolvePermission(file, userId, accessContext);
    if (access !== $Enums.FilePermission.EDIT) {
      throw new ForbiddenException('Edit access is required to share files.');
    }
  }

  private async ensureShareTargetInOrganization(
    targetType: FileShareTargetType,
    targetId: string,
    organizationId: string
  ) {
    switch (targetType) {
      case FileShareTargetType.USER: {
        const user = await this.prisma.user.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        if (!user) {
          throw new ForbiddenException('User target not found in organization.');
        }
        return;
      }
      case FileShareTargetType.SCHOOL: {
        const school = await this.prisma.school.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        if (!school) {
          throw new ForbiddenException('School target not found in organization.');
        }
        return;
      }
      case FileShareTargetType.CLASS_GROUP: {
        const classGroup = await this.prisma.classGroup.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        if (!classGroup) {
          throw new ForbiddenException(
            'Class group target not found in organization.'
          );
        }
        return;
      }
      case FileShareTargetType.COURSE: {
        const course = await this.prisma.course.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        if (!course) {
          throw new ForbiddenException('Course target not found in organization.');
        }
        return;
      }
    }
  }

  private async upsertShare(shareFileInput: ShareFileInput) {
    const { fileId, targetId, permission } = shareFileInput;

    switch (shareFileInput.targetType) {
      case FileShareTargetType.USER:
        return this.prisma.fileShareUser.upsert({
          where: { fileId_userId: { fileId, userId: targetId } },
          create: { fileId, userId: targetId, permission },
          update: { permission },
        });
      case FileShareTargetType.SCHOOL:
        return this.prisma.fileShareSchool.upsert({
          where: { fileId_schoolId: { fileId, schoolId: targetId } },
          create: { fileId, schoolId: targetId, permission },
          update: { permission },
        });
      case FileShareTargetType.CLASS_GROUP:
        return this.prisma.fileShareClassGroup.upsert({
          where: { fileId_classGroupId: { fileId, classGroupId: targetId } },
          create: { fileId, classGroupId: targetId, permission },
          update: { permission },
        });
      case FileShareTargetType.COURSE:
        return this.prisma.fileShareCourse.upsert({
          where: { fileId_courseId: { fileId, courseId: targetId } },
          create: { fileId, courseId: targetId, permission },
          update: { permission },
        });
    }
  }

  private async updateShareRecord(updateShareInput: UpdateShareInput) {
    const { fileId, targetId, permission } = updateShareInput;

    switch (updateShareInput.targetType) {
      case FileShareTargetType.USER:
        return this.prisma.fileShareUser.update({
          where: { fileId_userId: { fileId, userId: targetId } },
          data: { permission },
        });
      case FileShareTargetType.SCHOOL:
        return this.prisma.fileShareSchool.update({
          where: { fileId_schoolId: { fileId, schoolId: targetId } },
          data: { permission },
        });
      case FileShareTargetType.CLASS_GROUP:
        return this.prisma.fileShareClassGroup.update({
          where: { fileId_classGroupId: { fileId, classGroupId: targetId } },
          data: { permission },
        });
      case FileShareTargetType.COURSE:
        return this.prisma.fileShareCourse.update({
          where: { fileId_courseId: { fileId, courseId: targetId } },
          data: { permission },
        });
    }
  }

  private async removeShareRecord(removeShareInput: RemoveShareInput) {
    const { fileId, targetId } = removeShareInput;

    switch (removeShareInput.targetType) {
      case FileShareTargetType.USER:
        return this.prisma.fileShareUser.delete({
          where: { fileId_userId: { fileId, userId: targetId } },
        });
      case FileShareTargetType.SCHOOL:
        return this.prisma.fileShareSchool.delete({
          where: { fileId_schoolId: { fileId, schoolId: targetId } },
        });
      case FileShareTargetType.CLASS_GROUP:
        return this.prisma.fileShareClassGroup.delete({
          where: { fileId_classGroupId: { fileId, classGroupId: targetId } },
        });
      case FileShareTargetType.COURSE:
        return this.prisma.fileShareCourse.delete({
          where: { fileId_courseId: { fileId, courseId: targetId } },
        });
    }
  }
}
