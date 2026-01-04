import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

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
}
