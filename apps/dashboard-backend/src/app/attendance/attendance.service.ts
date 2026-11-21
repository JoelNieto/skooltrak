import type { AuthUserContext } from '@/auth';
import { Prisma } from '@generated/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { enrolledIn } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';
import { AttendanceFilterInput } from './dto/attendance-filter.input';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';

export const ATTENDANCE_DENIED = 'No tienes acceso a la asistencia de este curso';
export const STUDENT_ATTENDANCE_DENIED = 'No puedes ver la asistencia de este estudiante';
export const RECORDS_NOT_ENROLLED = 'Hay estudiantes que no pertenecen a este curso y grupo';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);
const STAFF_ROLES = new Set([...ADMIN_ROLES, 'TEACHER']);

/**
 * Who may see or change attendance:
 * - a course's sessions and its attendance form: an admin of the course's organization or the
 *   course's teacher (reads and writes alike: sessions hold every student's record);
 * - one student's records and stats: staff of the student's organization, the student, or a
 *   linked parent.
 */
@Injectable({ scope: Scope.REQUEST })
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private caller(): AuthUserContext {
    const user = (this.request as { user?: AuthUserContext }).user;
    if (!user?.userId) throw new ForbiddenException(ATTENDANCE_DENIED);
    return user;
  }

  /** Throws 403 unless the caller is an admin of the course's organization or its teacher. */
  private async assertCourseStaff(courseId: string | undefined): Promise<{ organizationId: string }> {
    const user = this.caller();
    if (!courseId) throw new BadRequestException('courseId es obligatorio');
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { organizationId: true, teacher: { select: { userId: true } } },
    });
    if (!course || course.organizationId !== user.organizationId) throw new ForbiddenException(ATTENDANCE_DENIED);
    if (ADMIN_ROLES.has(user.role?.toUpperCase() ?? '')) return course;
    if (course.teacher?.userId === user.userId) return course;
    throw new ForbiddenException(ATTENDANCE_DENIED);
  }

  /** Throws 403 unless the caller is staff of the student's organization, the student, or a linked parent. */
  private async assertCanReadStudent(studentId: string): Promise<void> {
    const user = this.caller();
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { organizationId: true, userId: true, parents: { where: { userId: user.userId }, select: { id: true } } },
    });
    if (!student) throw new ForbiddenException(STUDENT_ATTENDANCE_DENIED);
    const staff = STAFF_ROLES.has(user.role?.toUpperCase() ?? '');
    if (staff && student.organizationId === user.organizationId) return;
    if (student.userId === user.userId || student.parents.length) return;
    throw new ForbiddenException(STUDENT_ATTENDANCE_DENIED);
  }

  async create(input: CreateAttendanceSessionInput) {
    const req = this.request;
    const { userId } = req.user as { userId: string };

    const { organizationId } = await this.assertCourseStaff(input.courseId);
    const group = await this.prisma.classGroup.findFirst({
      where: { id: input.classGroupId, organizationId },
      select: { id: true },
    });
    if (!group) throw new ForbiddenException(ATTENDANCE_DENIED);
    const studentIds = [...new Set(input.records.map((r) => r.studentId))];
    const enrolled = await this.prisma.student.count({
      where: { id: { in: studentIds }, classGroupId: input.classGroupId, ...enrolledIn(input.courseId) },
    });
    if (enrolled !== studentIds.length) throw new BadRequestException(RECORDS_NOT_ENROLLED);

    // Get teacher ID from user
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher not found for this user');
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
        organizationId,
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
    await this.assertCourseStaff(courseId);

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
    await this.assertCourseStaff(courseId);

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

  async findOne(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { id }, select: { courseId: true } });
    if (!session) throw new NotFoundException('Attendance session not found');
    await this.assertCourseStaff(session.courseId);
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

    await this.assertCourseStaff(record.attendanceSession.courseId);

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

    // Every record must exist, and the caller must manage the course of each record's session.
    const ids = [...new Set(records.map((r) => r.id))];
    const found = await this.prisma.attendanceRecord.findMany({
      where: { id: { in: ids } },
      select: { attendanceSession: { select: { courseId: true } } },
    });
    if (found.length !== ids.length) {
      throw new NotFoundException('Attendance record not found');
    }
    for (const courseId of new Set(found.map((r) => r.attendanceSession.courseId))) {
      await this.assertCourseStaff(courseId);
    }

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

    await this.assertCourseStaff(session.courseId);

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
    await this.assertCourseStaff(courseId);
    return this.prisma.student.findMany({
      where: {
        ...enrolledIn(courseId),
        classGroupId,
      },
      orderBy: { firstName: 'asc' },
      include: { classGroup: true },
    });
  }

  // Get attendance records for a specific student
  async getAttendanceByStudentId(studentId: string, take?: number) {
    await this.assertCanReadStudent(studentId);
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
    await this.assertCanReadStudent(studentId);
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
