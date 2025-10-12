import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { TeachersResolver } from './teachers.resolver';
import { TeachersService } from './teachers.service';

@Module({
  providers: [TeachersResolver, TeachersService],
  imports: [PrismaModule],
})
export class TeachersModule {}
