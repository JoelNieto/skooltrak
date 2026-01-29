import { Prisma } from '@generated/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { AttendanceFilterInput } from './dto/attendance-filter.input';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';

@Injectable({ scope: Scope.REQUEST })
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}

  private async validateTeacherAccess(courseId: string) {
    const { req } = this.context;
    const { userId, role } = req.user as { userId: string; role: string };

    if (role === 'ADMIN') return;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacher?.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage attendance for this course',
      );
    }
  }

  async create(input: CreateAttendanceSessionInput) {
    const { req } = this.context;
    const { userId } = req.user as { userId: string };

    await this.validateTeacherAccess(input.courseId);

    // Get teacher ID from user
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher not found for this user');
    }

    // Get organization from course
    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { organizationId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if session already exists for this course, group, and date
    const existingSession = await this.prisma.attendanceSession.findUnique({
      where: {
        courseId_classGroupId_date: {
          courseId: input.courseId,
          classGroupId: input.classGroupId,
          date: input.date,
        },
      },
    });

    if (existingSession) {
      throw new BadRequestException(
        'An attendance session already exists for this course, group, and date',
      );
    }

    return this.prisma.attendanceSession.create({
      data: {
        date: input.date,
        courseId: input.courseId,
        classGroupId: input.classGroupId,
        teacherId: teacher.id,
        organizationId: course.organizationId,
        records: {
          create: input.records.map((record) => ({
            studentId: record.studentId,
            status: record.status,
            comment: record.comment,
          })),
        },
      },
      include: {
        course: true,
        classGroup: true,
        teacher: true,
        records: {
          include: { student: { include: { classGroup: true } } },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });
  }

  async findAll(filter: AttendanceFilterInput) {
    const { courseId, classGroupId, startDate, endDate, skip, take } = filter;

    const where: Prisma.AttendanceSessionWhereInput = {
      courseId,
      ...(classGroupId && { classGroupId }),
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    return this.prisma.attendanceSession.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        course: true,
        classGroup: true,
        teacher: true,
        records: {
          include: { student: { include: { classGroup: true } } },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });
  }

  async count(filter: AttendanceFilterInput) {
    const { courseId, classGroupId, startDate, endDate } = filter;

    const where: Prisma.AttendanceSessionWhereInput = {
      courseId,
      ...(classGroupId && { classGroupId }),
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    return this.prisma.attendanceSession.count({ where });
  }

  findOne(id: string) {
    return this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        course: true,
        classGroup: true,
        teacher: true,
        records: {
          include: { student: { include: { classGroup: true } } },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });
  }

  async updateRecord(input: UpdateAttendanceRecordInput) {
    // Get the session to validate teacher access
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: input.id },
      include: { attendanceSession: true },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    await this.validateTeacherAccess(record.attendanceSession.courseId);

    return this.prisma.attendanceRecord.update({
      where: { id: input.id },
      data: {
        status: input.status,
        comment: input.comment,
      },
      include: { student: { include: { classGroup: true } } },
    });
  }

  async updateManyRecords(records: UpdateAttendanceRecordInput[]) {
    if (records.length === 0) return [];

    // Validate teacher access for the first record's session
    const firstRecord = await this.prisma.attendanceRecord.findUnique({
      where: { id: records[0].id },
      include: { attendanceSession: true },
    });

    if (!firstRecord) {
      throw new NotFoundException('Attendance record not found');
    }

    await this.validateTeacherAccess(firstRecord.attendanceSession.courseId);

    // Update all records in a transaction
    return this.prisma.$transaction(
      records.map((record) =>
        this.prisma.attendanceRecord.update({
          where: { id: record.id },
          data: {
            status: record.status,
            comment: record.comment,
          },
          include: { student: { include: { classGroup: true } } },
        }),
      ),
    );
  }

  async remove(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    await this.validateTeacherAccess(session.courseId);

    return this.prisma.attendanceSession.delete({
      where: { id },
      include: {
        course: true,
        classGroup: true,
        teacher: true,
        records: { include: { student: { include: { classGroup: true } } } },
      },
    });
  }

  // Get attendance statistics for a course
  async getStatsByCourse(courseId: string, classGroupId?: string) {
    const where: Prisma.AttendanceRecordWhereInput = {
      attendanceSession: {
        courseId,
        ...(classGroupId && { classGroupId }),
      },
    };

    const [total, present, absent, late, sickLeave, excused] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: 'PRESENT' },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: 'ABSENT' },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: 'LATE' },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: 'SICK_LEAVE' },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: 'EXCUSED' },
      }),
    ]);

    return {
      total,
      present,
      absent,
      late,
      sickLeave,
      excused,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
      absentPercentage: total > 0 ? (absent / total) * 100 : 0,
    };
  }

  // Get students for attendance form (by course and group)
  async getStudentsForAttendance(courseId: string, classGroupId: string) {
    return this.prisma.student.findMany({
      where: {
        courses: { some: { id: courseId } },
        classGroupId,
      },
      orderBy: { firstName: 'asc' },
      include: { classGroup: true },
    });
  }

  // Get attendance records for a specific student
  async getAttendanceByStudentId(studentId: string, take?: number) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentId },
      take: take || 50,
      orderBy: { attendanceSession: { date: 'desc' } },
      include: {
        student: { include: { classGroup: true } },
        attendanceSession: {
          include: {
            course: { include: { subject: true } },
            classGroup: true,
          },
        },
      },
    });
  }

  // Get attendance statistics for a student
  async getStudentAttendanceStats(studentId: string) {
    const [total, present, absent, late, sickLeave, excused] = await Promise.all([
      this.prisma.attendanceRecord.count({ where: { studentId } }),
      this.prisma.attendanceRecord.count({ where: { studentId, status: 'PRESENT' } }),
      this.prisma.attendanceRecord.count({ where: { studentId, status: 'ABSENT' } }),
      this.prisma.attendanceRecord.count({ where: { studentId, status: 'LATE' } }),
      this.prisma.attendanceRecord.count({ where: { studentId, status: 'SICK_LEAVE' } }),
      this.prisma.attendanceRecord.count({ where: { studentId, status: 'EXCUSED' } }),
    ]);

    return {
      total,
      present,
      absent,
      late,
      sickLeave,
      excused,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
    };
  }
}
