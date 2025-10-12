import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';

@Module({
  providers: [StudentsResolver, StudentsService],
  imports: [PrismaModule],
})
export class StudentsModule {}
