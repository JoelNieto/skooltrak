import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradesResolver } from './grades.resolver';
import { GradesService } from './grades.service';

@Module({
  providers: [GradesResolver, GradesService],
  imports: [PrismaModule],
  exports: [GradesService],
})
export class GradesModule {}
