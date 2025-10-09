import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
          connect: permissionIds.map((id) => ({
            id,
          })),
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

  remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
