import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { SignUpInput } from './dto/sign-up.input';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate JWT token for a user
   */
  private generateJwt(user: {
    id: string;
    email: string;
    organizationId: string | null;
    role?: { name: string; permissions?: { descriptiveId: string }[] } | null;
  }): string {
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'member',
      organizationId: user.organizationId,
      permissions: user.role?.permissions?.map((p) => p.descriptiveId) || [],
    };

    return jwt.sign(
      jwtPayload,
      process.env['JWT_SECRET'] || 'fallback-secret',
      { expiresIn: '7d' }
    );
  }

  getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: true, organization: true } },
        teacher: true,
        student: true,
        organization: true,
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

    // Generate unique slug for organization
    let baseSlug = this.generateSlug(schoolName);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.organization.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create all entities in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization (using school name)
      const organization = await tx.organization.create({
        data: {
          name: schoolName,
          slug,
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
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          password: hashedPassword,
          color: this.getRandomPastelColor(),
          roleId: role.id,
          organizationId: organization.id,
          emailVerified: true, // Auto-verify for new signups
        },
        include: { role: { include: { permissions: true } } },
      });

      // 4. Create Account for better-auth
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });

      // 5. Create Member linking user to organization
      await tx.member.create({
        data: {
          id: randomUUID(),
          organizationId: organization.id,
          userId: user.id,
          role: 'owner',
        },
      });

      // 6. Create first School
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

    const { user } = result;

    // Generate JWT for the new user
    const accessToken = this.generateJwt(user);
    return { accessToken };
  }
}
