import { Injectable } from '@nestjs/common';
import { FetchDataInput } from '../fetch-data-input';
import { PrismaService } from '../prisma.service';
import { CreatePermissionInput } from './dto/create-permission.input';
import { UpdatePermissionInput } from './dto/update-permission.input';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  create(createPermissionInput: CreatePermissionInput) {
    return this.prisma.permission.create({
      data: createPermissionInput,
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, search } = fetchDataInput;
    return this.prisma.permission.findMany({
      skip,
      take,
      where: {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { descriptiveId: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    return this.prisma.permission.count({
      where: {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { descriptiveId: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  update(id: string, updatePermissionInput: UpdatePermissionInput) {
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionInput,
    });
  }

  remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
}
