import { sendUserInvitation } from '@/auth';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';

@Injectable({ scope: Scope.REQUEST })
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {
    //this.initColors();
  }
  async create(createTeacherInput: CreateTeacherInput) {
    const { email, ...rest } = createTeacherInput;
    const role = await this.prisma.role.findFirstOrThrow({
      where: {
        organizationId: null,
        name: 'TEACHER',
      },
    });

    // Get organization name for the welcome email
    const organization = await this.prisma.organization.findUnique({
      where: { id: createTeacherInput.organizationId },
      select: { name: true },
    });

    const hashedPassword = bcrypt.hashSync(rest.documentId, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: rest.firstName,
        lastName: rest.fatherName,
        email: email,
        color: this.getRandomPastelColor(),
        password: hashedPassword,
        organizationId: createTeacherInput.organizationId,
        roleId: role.id,
        emailVerified: false, // Will be verified when user clicks the email link
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

    const teacher = await this.prisma.teacher.create({
      data: {
        ...rest,
        userId: user.id,
      },
    });

    // Send welcome invitation email
    try {
      await sendUserInvitation({
        prisma: this.prisma,
        email,
        name: `${rest.firstName} ${rest.fatherName}`,
        role: 'teacher',
        organizationName: organization?.name || 'Skooltrak',
      });
      this.logger.log(`Welcome invitation sent to teacher: ${email}`);
    } catch (error) {
      // Log error but don't fail the creation
      this.logger.error(`Failed to send welcome invitation to ${email}:`, error);
    }

    return teacher;
  }

  async initColors() {
    const users = await this.prisma.user.findMany();
    const update = users.map((user) => {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { color: this.getRandomPastelColor() },
      });
    });

    await Promise.all(update);
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search, orderBy, orderDirection } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.teacher.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { fatherName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection,
      },
    });
  }

  findManyByOrganizationId(organizationId: string) {
    return this.prisma.teacher.findMany({
      where: { organizationId },
      include: { user: true },
    });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, color: true, emailVerified: true } },
        classGroups: true,
        courses: true,
        assignments: true,
        subjects: true,
      },
    });
  }

  findCount(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    const { req } = this.context;
    const { organizationId } = req.user as any;
    return this.prisma.teacher.count({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { fatherName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
    });
  }

  async update(id: string, updateTeacherInput: UpdateTeacherInput) {
    // Extract email and other non-Teacher fields
    const { email, organizationId, ...teacherData } = updateTeacherInput as any;

    // Update teacher data (excluding email which belongs to User)
    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: teacherData,
      include: { user: { select: { id: true, email: true } } },
    });

    // If email was provided and changed, update the user's email
    if (email && teacher.user && email !== teacher.user.email) {
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: { email },
      });
    }

    return teacher;
  }

  remove(id: string) {
    return this.prisma.teacher.delete({ where: { id } });
  }
}
