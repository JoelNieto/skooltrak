import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  create(createUserInput: CreateUserInput) {
    return this.prisma.user.create({
      include: {
        role: true,
        organization: true,
      },
      data: {
        ...createUserInput,
        password: bcrypt.hashSync(createUserInput.password, 10),
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        role: true,
        organization: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
