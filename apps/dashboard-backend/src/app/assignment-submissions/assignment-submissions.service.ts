import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Prisma } from '@generated/prisma';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import {
  CreateAssignmentSubmissionInput,
  CreateSubmissionUploadInput,
} from './dto/create-submission.input';

type AuthUserContext = {
  userId: string;
  organizationId?: string | null;
};

@Injectable({ scope: Scope.REQUEST })
export class AssignmentSubmissionsService {
  private readonly submissionInclude: Prisma.AssignmentSubmissionInclude = {
    assignment: { include: { course: true, teacher: true } },
    student: true,
    file: true,
  };

  private readonly s3Client: S3Client;
  private readonly r2Bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REQUEST) private readonly request: Request
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

  async createUploadUrl(input: CreateSubmissionUploadInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const student = await this.prisma.student.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('Only students can upload submissions.');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: input.assignmentId,
        course: { organizationId },
        requireSubmission: true,
      },
      include: { course: { select: { students: { where: { id: student.id } } } } },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found or does not require submission.');
    }

    if (assignment.course.students.length === 0) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }

    const storageKey = this.buildStorageKey(input.assignmentId, student.id, input.fileName);
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

  async createSubmission(input: CreateAssignmentSubmissionInput) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const student = await this.prisma.student.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('Only students can submit assignments.');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: input.assignmentId,
        course: { organizationId },
        requireSubmission: true,
      },
      include: { course: { select: { students: { where: { id: student.id } } } } },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found or does not require submission.');
    }

    if (assignment.course.students.length === 0) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }

    // Check if student already has a submission, if so, delete it first
    const existingSubmission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: input.assignmentId,
          studentId: student.id,
        },
      },
      include: { file: true },
    });

    // Use a transaction to create file and submission atomically
    return this.prisma.$transaction(async (tx) => {
      // Delete existing submission and file if exists
      if (existingSubmission) {
        await tx.assignmentSubmission.delete({
          where: { id: existingSubmission.id },
        });
        await tx.file.delete({
          where: { id: existingSubmission.fileId },
        });
      }

      // Create the file record
      const file = await tx.file.create({
        data: {
          name: input.fileName,
          mimeType: input.mimeType,
          size: input.fileSize,
          storageKey: input.storageKey,
          ownerId: userId,
          organizationId,
        },
      });

      // Create the submission
      const submission = await tx.assignmentSubmission.create({
        data: {
          assignmentId: input.assignmentId,
          studentId: student.id,
          fileId: file.id,
        },
        include: this.submissionInclude,
      });

      return submission;
    });
  }

  async getMySubmission(assignmentId: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const student = await this.prisma.student.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });

    if (!student) {
      return null;
    }

    return this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      include: this.submissionInclude,
    });
  }

  async getSubmissionsByAssignment(assignmentId: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    // Verify user is a teacher or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, teacher: true },
    });

    const isTeacherOrAdmin =
      user?.role?.name === 'ADMIN' ||
      user?.role?.name === 'ORG_ADMIN' ||
      user?.role?.name === 'TEACHER';

    if (!isTeacherOrAdmin) {
      throw new ForbiddenException('Only teachers and admins can view all submissions.');
    }

    // Verify assignment exists and user has access
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        course: { organizationId },
      },
      include: {
        course: {
          include: {
            students: {
              orderBy: [{ fatherName: 'asc' }, { firstName: 'asc' }],
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    // Get all submissions for this assignment
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: this.submissionInclude,
    });

    return submissions;
  }

  async getStudentsForAssignment(assignmentId: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    // First, get the assignment and verify it exists
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        course: { organizationId },
      },
      select: { id: true, courseId: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    // Get students for the course
    const students = await this.prisma.student.findMany({
      where: {
        courses: { some: { id: assignment.courseId } },
      },
      orderBy: [{ fatherName: 'asc' }, { firstName: 'asc' }],
    });

    // Get submissions for this assignment
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: { file: true },
    });

    // Map submissions to students
    const submissionsByStudent = new Map(
      submissions.map((sub) => [sub.studentId, sub])
    );

    // Combine students with their submissions
    return students.map((student) => ({
      ...student,
      assignmentSubmissions: submissionsByStudent.has(student.id)
        ? [submissionsByStudent.get(student.id)]
        : [],
    }));
  }

  async deleteSubmission(submissionId: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const student = await this.prisma.student.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('Only students can delete their submissions.');
    }

    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        studentId: student.id,
      },
      include: { file: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found or you do not have access.');
    }

    // Delete submission and file
    await this.prisma.$transaction(async (tx) => {
      await tx.assignmentSubmission.delete({
        where: { id: submissionId },
      });
      await tx.file.delete({
        where: { id: submission.fileId },
      });
    });

    return true;
  }

  async createDownloadUrl(fileId: string) {
    const { userId, organizationId } = this.getUserContext();
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const file = await this.prisma.file.findFirst({
      where: { id: fileId, organizationId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    // Verify access - either the owner, or a teacher/admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isOwner = file.ownerId === userId;
    const isTeacherOrAdmin =
      user?.role?.name === 'ADMIN' ||
      user?.role?.name === 'ORG_ADMIN' ||
      user?.role?.name === 'TEACHER';

    if (!isOwner && !isTeacherOrAdmin) {
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

  private getUserContext() {
    const req = this.request;
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

  private buildStorageKey(assignmentId: string, studentId: string, fileName: string) {
    const safeName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `assignments/${assignmentId}/${studentId}/${timestamp}-${safeName}`;
  }
}
