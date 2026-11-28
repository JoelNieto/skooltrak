import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { orgInvitationState } from './org-invitation-state';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  create(createOrganizationInput: CreateOrganizationInput) {
    return this.prisma.organization.create({ data: createOrganizationInput });
  }

  /** Organizations with their latest admin invitation and its derived state (IAM-001 FR .4). */
  async findAll() {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        adminInvitations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, email: true, firstName: true, lastName: true, status: true, expiresAt: true, createdAt: true },
        },
      },
    });
    return organizations.map(({ adminInvitations, ...organization }) => {
      const latest = adminInvitations[0];
      return {
        ...organization,
        adminInvitation: latest ? { ...latest, state: orgInvitationState(latest) } : null,
      };
    });
  }

  findOne(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  update(id: string, updateOrganizationInput: UpdateOrganizationInput) {
    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationInput,
    });
  }

  remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
