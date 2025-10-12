import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { ClassGroupsResolver } from './class-groups.resolver';
import { ClassGroupsService } from './class-groups.service';

@Module({
  providers: [ClassGroupsResolver, ClassGroupsService],
  imports: [PrismaModule],
})
export class ClassGroupsModule {}
