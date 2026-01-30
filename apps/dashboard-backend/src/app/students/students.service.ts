import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request }
  ) {}
  async create(createStudentInput: CreateStudentInput) {
    const {
      email,
      organizationId,
      schoolId,
      classGroupId,
      parentIds,
      firstName,
      middleName,
      fatherName,
      motherName,
      documentId,
      birthDate,
      gender,
      address,
      phone,
      enrollmentStatus,
      bloodType,
      allergies,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone,
    } = createStudentInput;

    const role = await this.prisma.role.findFirstOrThrow({
      where: {
        organizationId: null,
        name: 'STUDENT',
      },
    });

    const hashedPassword = bcrypt.hashSync(documentId, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName: fatherName,
        email: email,
        color: this.getRandomPastelColor(),
        password: hashedPassword,
        organizationId,
        roleId: role.id,
      },
    });

    // Create Account for Better Auth credential login
    await this.prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
      },
    });

    // Only connect courses if classGroupId is provided
    let coursesToConnect: { id: string }[] = [];
    if (classGroupId) {
      const group = await this.prisma.classGroup.findUnique({
        where: { id: classGroupId },
      });
      if (group) {
        const courses = await this.prisma.course.findMany({
          where: { studyPlanId: group.studyPlanId },
        });
        coursesToConnect = courses.map((course) => ({ id: course.id }));
      }
    }

    // Convert birthDate properly - handle both Date and string
    const parsedBirthDate = birthDate instanceof Date ? birthDate : new Date(birthDate);
    
    const studentData = {
      firstName,
      middleName,
      fatherName,
      motherName,
      documentId,
      birthDate: parsedBirthDate,
      gender,
      address,
      phone,
      enrollmentStatus: enrollmentStatus || 'ACTIVE',
      bloodType: bloodType || '',
      allergies: allergies || '',
      medicalNotes: medicalNotes || '',
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      userId: user.id,
      organizationId,
      schoolId,
      classGroupId: classGroupId || null,
      courses: coursesToConnect.length > 0 ? { connect: coursesToConnect } : undefined,
      parents: parentIds?.length ? { connect: parentIds.map((id) => ({ id })) } : undefined,
    };

    console.log('Creating student with data:', JSON.stringify(studentData, null, 2));

    try {
      return await this.prisma.student.create({
        data: studentData,
        include: { classGroup: true, user: true, parents: true },
      });
    } catch (error) {
      console.error('Prisma error creating student:', error);
      throw error;
    }
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.student.findMany({
      where: {
        organizationId,
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
      include: { classGroup: true, user: true },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection,
      },
    });
  }

  getCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.student.count({
      where: {
        organizationId,
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId },
      include: { classGroup: true, user: true },
    });
  }

  findManyByCourseId(courseId: string) {
    return this.prisma.student.findMany({
      where: { courses: { some: { id: courseId } } },
      include: { classGroup: true, user: true },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async getStudentsGrades(id: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        students: { some: { id } },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all course IDs and their current period IDs
    const coursePeriodMap = new Map<string, string>();
    courses.forEach((course) => {
      if (course.currentPeriodId) {
        coursePeriodMap.set(course.id, course.currentPeriodId);
      }
    });

    if (coursePeriodMap.size === 0) {
      return courses.map((course) => ({
        ...course,
        grades: [],
      }));
    }

    // Fetch grades for all courses, filtered by published and current period
    const grades = await this.prisma.grade.findMany({
      where: {
        courseId: { in: Array.from(coursePeriodMap.keys()) },
        published: true,
        OR: Array.from(coursePeriodMap.entries()).map(
          ([courseId, periodId]) => ({
            courseId,
            periodId,
          })
        ),
      },
      include: {
        studentGrades: {
          where: {
            studentId: id,
          },
        },
        bucket: true,
        period: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group grades by courseId
    const gradesByCourse = new Map<string, typeof grades>();
    grades.forEach((grade) => {
      const existing = gradesByCourse.get(grade.courseId);
      if (existing) {
        existing.push(grade);
      } else {
        gradesByCourse.set(grade.courseId, [grade]);
      }
    });

    // Attach grades to courses
    return courses.map((course) => ({
      ...course,
      grades: gradesByCourse.get(course.id) || [],
    }));
  }

  findOne(id: string) {
    return this.prisma.student.findUniqueOrThrow({
      where: { id },
      include: {
        classGroup: {
          include: { studyPlan: { include: { gradeMetric: true } } },
        },
        courses: {
          include: { subject: true, teacher: { include: { user: true } } },
          orderBy: { subject: { name: 'asc' } },
        },
        user: true,
        parents: true,
        studentGrades: {
          include: {
            grade: {
              include: {
                period: true,
                bucket: true,
                course: { include: { subject: true } },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateStudentInput: UpdateStudentInput) {
    const { email, parentIds, birthDate, ...rest } = updateStudentInput;

    // Build update data, only including defined fields
    const updateData: Record<string, unknown> = {};

    // Only add fields that are explicitly provided
    if (rest.firstName !== undefined) updateData.firstName = rest.firstName;
    if (rest.middleName !== undefined) updateData.middleName = rest.middleName;
    if (rest.fatherName !== undefined) updateData.fatherName = rest.fatherName;
    if (rest.motherName !== undefined) updateData.motherName = rest.motherName;
    if (rest.documentId !== undefined) updateData.documentId = rest.documentId;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (rest.gender !== undefined) updateData.gender = rest.gender;
    if (rest.address !== undefined) updateData.address = rest.address;
    if (rest.phone !== undefined) updateData.phone = rest.phone;
    if (rest.classGroupId !== undefined) updateData.classGroupId = rest.classGroupId || null;
    if (rest.enrollmentStatus !== undefined) updateData.enrollmentStatus = rest.enrollmentStatus;
    if (rest.bloodType !== undefined) updateData.bloodType = rest.bloodType;
    if (rest.allergies !== undefined) updateData.allergies = rest.allergies;
    if (rest.medicalNotes !== undefined) updateData.medicalNotes = rest.medicalNotes;
    if (rest.emergencyContactName !== undefined) updateData.emergencyContactName = rest.emergencyContactName;
    if (rest.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = rest.emergencyContactPhone;

    // If parentIds is provided, update the relationship
    if (parentIds !== undefined) {
      updateData.parents = {
        set: parentIds.map((parentId) => ({ id: parentId })),
      };
    }

    return this.prisma.student.update({
      where: { id },
      data: updateData,
      include: { classGroup: true, user: true, parents: true },
    });
  }

  async remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }
}
