import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { auth } from './better-auth';
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

    return jwt.sign(jwtPayload, process.env['JWT_SECRET'] || 'fallback-secret', { expiresIn: '7d' });
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
    const { schoolName, schoolShortName, email, firstName, lastName, password } = input;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use user name for organization if no school name provided
    const orgName = schoolName || `${firstName} ${lastName}`;

    // Generate unique slug for organization
    let baseSlug = this.generateSlug(orgName);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.organization.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create all entities in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          description: '',
          active: true,
          onboardingCompleted: false,
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
          emailVerified: false, // Email verification required
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

      // 6. Create first School only if school name is provided
      if (schoolName && schoolShortName) {
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
      }

      return { user, role, organization };
    });

    const { user } = result;

    // Send verification email
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email: user.email,
          callbackURL: `${process.env['APP_URL'] || 'http://localhost:4200'}/verify-email`,
        },
      });
    } catch (error) {
      console.error('[AuthService] Failed to send verification email:', error);
      // Don't fail signup if email sending fails
    }

    // Generate JWT for the new user
    const accessToken = this.generateJwt(user);
    return { accessToken };
  }

  /**
   * Check if a user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    return user?.emailVerified ?? false;
  }

  /**
   * Get onboarding status for an organization
   */
  async getOnboardingStatus(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        onboardingCompleted: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
    });

    const school = await this.prisma.school.findFirst({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            degrees: true,
            studyPlans: true,
            courses: true,
            classGroups: true,
          },
        },
      },
    });

    return {
      onboardingCompleted: org?.onboardingCompleted ?? false,
      schoolId: school?.id,
      schoolName: school?.name,
      degreesCount: school?._count?.degrees ?? 0,
      studyPlansCount: school?._count?.studyPlans ?? 0,
      coursesCount: school?._count?.courses ?? 0,
      groupsCount: school?._count?.classGroups ?? 0,
    };
  }

  /**
   * Mark onboarding as completed for an organization
   */
  async completeOnboarding(organizationId: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingCompleted: true },
    });
  }
}
