import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

@Module({
  controllers: [SubjectsController],
  providers: [
    SubjectsService,
  ],
  imports: [PrismaModule],
})
export class SubjectsModule {}
