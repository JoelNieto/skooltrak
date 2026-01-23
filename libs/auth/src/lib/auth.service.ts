import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpInput } from './dto/sign-up.input';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  private getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { id, role, organizationId } = user;

    if (!(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken: this.jwtService.sign(
        {
          userId: id,
          role: role.name,
          organizationId: organizationId,
          permissions: role.permissions.map((p) => p.descriptiveId),
        },
        { secret: process.env['JWT_SECRET'] }
      ),
    };
  }

  getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: true } },
        teacher: true,
        student: true,
      },
    });
  }

  async signUp(input: SignUpInput) {
    const { schoolName, schoolShortName, email, firstName, lastName, password } =
      input;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create all entities in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization (using school name)
      const organization = await tx.organization.create({
        data: {
          name: schoolName,
          description: '',
          active: true,
        },
      });

      // 2. Create ORG_ADMIN Role for this organization
      const role = await tx.role.create({
        data: {
          name: 'ORG_ADMIN',
          description: 'Organization Administrator',
          organizationId: organization.id,
        },
        include: { permissions: true },
      });

      // 3. Create User with the ORG_ADMIN role
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
          color: this.getRandomPastelColor(),
          roleId: role.id,
          organizationId: organization.id,
        },
        include: { role: { include: { permissions: true } } },
      });

      // 4. Create first School
      await tx.school.create({
        data: {
          name: schoolName,
          shortName: schoolShortName,
          organizationId: organization.id,
          logo: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          email: '',
          phone: '',
          website: '',
        },
      });

      return { user, role, organization };
    });

    const { user, role, organization } = result;

    // Return JWT token
    return {
      accessToken: this.jwtService.sign(
        {
          userId: user.id,
          role: role.name,
          organizationId: organization.id,
          permissions: role.permissions.map((p) => p.descriptiveId),
        },
        { secret: process.env['JWT_SECRET'] }
      ),
    };
  }
}
