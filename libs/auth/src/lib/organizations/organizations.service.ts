import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  create(createOrganizationInput: CreateOrganizationInput) {
    return this.prisma.organization.create({ data: createOrganizationInput });
  }

  findAll() {
    return this.prisma.organization.findMany();
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
