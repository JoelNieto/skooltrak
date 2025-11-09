import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AssignmentsResolver } from './assignments.resolver';
import { AssignmentsService } from './assignments.service';

@Module({
  providers: [AssignmentsResolver, AssignmentsService],
  imports: [PrismaModule],
})
export class AssignmentsModule {}
