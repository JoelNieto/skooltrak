import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import { Prisma } from '@generated/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';

@Injectable()
export class ClassGroupsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createClassGroupInput: CreateClassGroupInput) {
    return this.prisma.classGroup.create({
      data: createClassGroupInput,
    });
  }

  /** `organizationId`: the caller's; the list never leaves it. `onlyGroupIds`: a student's own group. */
  async findAll(fetchDataInput: FetchDataQueryDto, organizationId: string, onlyGroupIds?: string[]) {
    const { skip, page, pageSize, schoolId, search, studyPlanId, teacherId } = fetchDataInput;
    let where: Prisma.ClassGroupWhereInput = {
      organizationId,
      ...(onlyGroupIds ? { id: { in: onlyGroupIds } } : {}),
      schoolId,
      studyPlanId,
      teacherId,
    };
    if (search) {
      where = {
        ...where,
        OR: [{ name: { contains: search, mode: 'insensitive' } }],
      };
    }
    Logger.debug('Where', { where });
    const [data, total] = await this.prisma.$transaction([
      this.prisma.classGroup.findMany({
        include: {
          teacher: { select: TEACHER_PUBLIC },
          studyPlan: {
            include: {
              degree: true,
            },
          },
        },
        where,
        skip,
        take: pageSize,
      }),
      this.prisma.classGroup.count({ where }),
    ]);
    return new PaginatedResponseDto(data, total, page, pageSize);
  }

  count(fetchDataInput: FetchDataQueryDto, organizationId: string, onlyGroupIds?: string[]) {
    const { schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.ClassGroupWhereInput = {
      organizationId,
      ...(onlyGroupIds ? { id: { in: onlyGroupIds } } : {}),
      schoolId,
      studyPlanId,
    };
    if (search) {
      where = {
        ...where,
        OR: [{ name: { contains: search, mode: 'insensitive' } }],
      };
    }
    return this.prisma.classGroup.count({ where });
  }

  findAllByOrganizationId(organizationId: string) {
    return this.prisma.classGroup.findMany({
      where: { organizationId },
      include: {
        teacher: { select: TEACHER_PUBLIC },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
  }

  findAllBySchoolId(schoolId: string) {
    return this.prisma.classGroup.findMany({
      where: { schoolId },
      include: {
        teacher: { select: TEACHER_PUBLIC },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
  }

  async findAllByCourseId(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { studyPlanId: true },
    });
    if (!course) return [];
    return this.prisma.classGroup.findMany({
      where: { studyPlanId: course.studyPlanId },
      include: {
        teacher: { select: TEACHER_PUBLIC },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * The group page: names, document ids and avatars only, never contact or medical details. A
   * student viewer (`viewerStudentId`) also doesn't get classmates' document ids.
   */
  async findOne(id: string, viewerStudentId?: string) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id },
      include: {
        teacher: { select: { ...TEACHER_PUBLIC, user: { select: USER_PUBLIC } } },
        students: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            fatherName: true,
            motherName: true,
            documentId: true,
            classGroupId: true,
            enrollmentStatus: true,
            user: { select: USER_PUBLIC },
          },
          orderBy: { firstName: 'asc' },
        },
        studyPlan: {
          include: {
            degree: true,
          },
        },
      },
    });
    if (!classGroup) return null;

    // Fetch courses via studyPlan
    const courses = await this.prisma.course.findMany({
      where: { studyPlanId: classGroup.studyPlanId },
      include: { teacher: { select: TEACHER_PUBLIC }, subject: true },
      orderBy: { subject: { name: 'asc' } },
    });

    const students = viewerStudentId
      ? classGroup.students.map((st) => (st.id === viewerStudentId ? st : { ...st, documentId: '' }))
      : classGroup.students;
    return { ...classGroup, students, courses };
  }

  update(id: string, updateClassGroupInput: UpdateClassGroupInput) {
    // The organization never changes (the caller's access was checked against it).
    const { name, studyPlanId, teacherId, active, schoolId } = updateClassGroupInput;

    const data: Prisma.ClassGroupUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (active !== undefined) data.active = active;
    if (studyPlanId !== undefined) {
      data.studyPlan = { connect: { id: studyPlanId } };
    }
    if (teacherId !== undefined) {
      data.teacher = teacherId ? { connect: { id: teacherId } } : { disconnect: true };
    }
    if (schoolId !== undefined) {
      data.school = { connect: { id: schoolId } };
    }

    return this.prisma.classGroup.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.classGroup.delete({ where: { id } });
  }
}

/** What a group's pages show of a teacher: never contact, address or document details. */
const TEACHER_PUBLIC = {
  id: true,
  firstName: true,
  middleName: true,
  fatherName: true,
  motherName: true,
  userId: true,
} as const;

/** What a group's pages show of a user: never the email or account fields. */
const USER_PUBLIC = { id: true, name: true, firstName: true, lastName: true, color: true, image: true } as const;
