import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarService } from './avatar.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    AvatarService,
  ],
  imports: [PrismaModule],
})
export class UsersModule {}
