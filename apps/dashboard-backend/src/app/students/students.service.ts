import { sendUserInvitation } from '@/auth';
import { ConflictException, Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { ChatSyncService } from '../chats/chat-sync.service';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatSync: ChatSyncService,
    @Inject(CONTEXT) private readonly context: { req: Request },
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

    // Get organization name for the welcome email
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    const hashedPassword = bcrypt.hashSync(documentId, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { student: true },
    });

    if (existingUser?.student) {
      throw new ConflictException('Student already exists, contact support');
    }

    let user: { id: string };
    if (existingUser) {
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName,
          lastName: fatherName,
          organizationId,
          roleId: role.id,
          password: hashedPassword,
          onboardingStep: 'completed', // Admin-created students skip onboarding
        },
      });
      user = { id: existingUser.id };

      const credentialAccount = await this.prisma.account.findFirst({
        where: { userId: existingUser.id, providerId: 'credential' },
      });
      if (credentialAccount) {
        await this.prisma.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await this.prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password: hashedPassword,
          },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          firstName,
          lastName: fatherName,
          email: email,
          color: this.getRandomPastelColor(),
          password: hashedPassword,
          organizationId,
          roleId: role.id,
          emailVerified: false, // Will be verified when user clicks the email link
          onboardingStep: 'completed', // Admin-created students skip onboarding
        },
      });

      await this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });
    }

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

    this.logger.log(`Creating student with data: ${JSON.stringify(studentData, null, 2)}`);

    try {
      const student = await this.prisma.student.create({
        data: studentData,
        include: { classGroup: true, user: true, parents: true },
      });

      // Send welcome invitation email
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email,
          name: `${firstName} ${fatherName}`,
          role: 'student',
          organizationName: organization?.name || 'Skooltrak',
        });
        this.logger.log(`Welcome invitation sent to student: ${email}`);
      } catch (emailError) {
        // Log error but don't fail the creation
        this.logger.error(`Failed to send welcome invitation to ${email}:`, emailError);
      }

      // Add student to contextual chats for class group and courses
      try {
        if (classGroupId) {
          await this.chatSync.addUserToClassGroupChats(classGroupId, user.id);
        }
        for (const course of coursesToConnect) {
          await this.chatSync.addUserToCourseChats(course.id, user.id);
        }
      } catch (chatError) {
        this.logger.warn(`Failed to add student to contextual chats:`, chatError);
      }

      return student;
    } catch (error) {
      this.logger.error('Prisma error creating student:', error);
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

  async getStudentsGrades(id: string, periodId?: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        students: { some: { id } },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return [];
    }

    // Build grade filter: always filter by published, optionally by periodId
    const where: any = {
      courseId: { in: courseIds },
      published: true,
    };

    if (periodId) {
      where.periodId = periodId;
    }

    // Fetch grades for all courses
    const grades = await this.prisma.grade.findMany({
      where,
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

    // Sync courses when classGroupId changes
    if (rest.classGroupId !== undefined) {
      if (rest.classGroupId) {
        const group = await this.prisma.classGroup.findUnique({
          where: { id: rest.classGroupId },
        });
        if (group) {
          const courses = await this.prisma.course.findMany({
            where: { studyPlanId: group.studyPlanId },
          });
          updateData.courses = {
            set: courses.map((course) => ({ id: course.id })),
          };
        }
      } else {
        // If classGroupId is being cleared, disconnect all courses
        updateData.courses = { set: [] };
      }
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: updateData,
      include: { classGroup: true, user: true, parents: true },
    });

    // Add student to contextual chats when class group or courses change
    try {
      if (rest.classGroupId && updated.userId) {
        await this.chatSync.addUserToClassGroupChats(rest.classGroupId, updated.userId);
      }
      if (updateData.courses && 'set' in (updateData.courses as object) && updated.userId) {
        const courseIds = (updateData.courses as { set: { id: string }[] }).set.map((c) => c.id);
        for (const courseId of courseIds) {
          await this.chatSync.addUserToCourseChats(courseId, updated.userId);
        }
      }
    } catch (chatError) {
      this.logger.warn(`Failed to add student to contextual chats on update:`, chatError);
    }

    return updated;
  }

  async remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }
}
