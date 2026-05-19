import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { ClassGroupsController } from './class-groups.controller';
import { ClassGroupsService } from './class-groups.service';

@Module({
  controllers: [ClassGroupsController],
  providers: [
    ClassGroupsService,
  ],
  imports: [PrismaModule],
})
export class ClassGroupsModule {}
