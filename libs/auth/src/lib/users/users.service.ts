import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { FetchDataInput } from '../fetch-data-input';
import { PrismaService } from '../prisma.service';
import { sendUserInvitation } from '../resend.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  async create(createUserInput: CreateUserInput) {
    const password = bcrypt.hashSync(createUserInput.password, 10);

    // Look up the role to check if it's a TEACHER
    const role = createUserInput.roleId
      ? await this.prisma.role.findUnique({
          where: { id: createUserInput.roleId },
        })
      : null;

    const isTeacher = role?.name === 'TEACHER';

    const user = await this.prisma.user.create({
      data: {
        ...createUserInput,
        color: this.getRandomPastelColor(),
        password,
        emailVerified: isTeacher ? false : undefined,
        onboardingStep: isTeacher ? 'completed' : undefined,
      },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });

    if (isTeacher) {
      // Create Account record for Better Auth credential login
      await this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password,
        },
      });

      // Fetch organization name for the welcome email
      const organization = createUserInput.organizationId
        ? await this.prisma.organization.findUnique({
            where: { id: createUserInput.organizationId },
            select: { name: true },
          })
        : null;

      // Send welcome invitation email
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: 'teacher',
          organizationName: organization?.name || 'Skooltrak',
        });
        this.logger.log(`Welcome invitation sent to teacher: ${user.email}`);
      } catch (error) {
        // Log error but don't fail the creation
        this.logger.error(
          `Failed to send welcome invitation to ${user.email}:`,
          error,
        );
      }
    }

    return user;
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search } = fetchDataInput;
    return this.prisma.user.findMany({
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
      skip,
      take,
      where: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    return this.prisma.user.count({
      where: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      const password = bcrypt.hashSync(updateUserInput.password, 10);
      updateUserInput.password = password;
    }
    return this.prisma.user.update({
      where: { id },
      data: { ...updateUserInput, color: this.getRandomPastelColor() },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
