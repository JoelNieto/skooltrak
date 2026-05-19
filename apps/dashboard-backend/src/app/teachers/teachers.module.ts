import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  controllers: [TeachersController],
  providers: [
    TeachersService,
  ],
  imports: [PrismaModule],
})
export class TeachersModule {}
