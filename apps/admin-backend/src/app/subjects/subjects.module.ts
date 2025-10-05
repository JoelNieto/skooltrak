import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SubjectsResolver } from './subjects.resolver';
import { SubjectsService } from './subjects.service';

@Module({
  imports: [PrismaModule],
  providers: [SubjectsResolver, SubjectsService],
})
export class SubjectsModule {}
