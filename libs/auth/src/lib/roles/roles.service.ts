import { Prisma } from '@generated/prisma';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleInput: CreateRoleInput) {
    const { organizationId, permissionIds, ...rest } = createRoleInput;
    let req = rest as Prisma.RoleCreateInput;

    if (organizationId) {
      req = {
        ...req,
        organization: {
          connect: {
            id: organizationId,
          },
        },
      };
    }

    if (permissionIds) {
      req = {
        ...req,
        permissions: {
          connect: permissionIds.map((id) => ({
            id,
          })),
        },
      };
    }
    return this.prisma.role.create({
      data: req,
      include: {
        organization: true,
        permissions: true,
      },
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      include: {
        organization: true,
        permissions: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { organization: true, permissions: true },
    });
  }

  async update(id: string, updateRoleInput: UpdateRoleInput) {
    await this.assertNotGlobalRole(id);

    const { organizationId, permissionIds, ...rest } = updateRoleInput;
    let req = rest as Prisma.RoleUpdateInput;

    if (organizationId) {
      req = {
        ...req,
        organization: {
          connect: {
            id: organizationId,
          },
        },
      };
    }

    if (permissionIds) {
      req = {
        ...req,
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
      };
    }
    return this.prisma.role.update({
      where: { id },
      data: req,
      include: {
        organization: true,
        permissions: true,
      },
    });
  }

  async remove(id: string) {
    await this.assertNotGlobalRole(id);

    return this.prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Prevents mutation or deletion of global default roles (organizationId = null).
   */
  private async assertNotGlobalRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (role && role.organizationId === null) {
      throw new ForbiddenException('Global default roles cannot be modified or deleted');
    }
  }
}
