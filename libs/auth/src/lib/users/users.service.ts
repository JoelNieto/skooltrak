import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  create(createUserInput: CreateUserInput) {
    const password = bcrypt.hashSync(createUserInput.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserInput,
        color: this.getRandomPastelColor(),
        password,
      },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      const password = bcrypt.hashSync(updateUserInput.password, 10);
      updateUserInput.password = password;
    }
    return this.prisma.user.update({
      where: { id },
      data: { ...updateUserInput, color: this.getRandomPastelColor() },
      include: {
        role: { include: { permissions: true } },
        organization: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
