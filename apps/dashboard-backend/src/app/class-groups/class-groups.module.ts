import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { ClassGroupsController } from './class-groups.controller';
import { ClassGroupsResolver } from './class-groups.resolver';
import { ClassGroupsService } from './class-groups.service';

@Module({
  controllers: [ClassGroupsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [ClassGroupsResolver] : []),
    ClassGroupsService,
  ],
  imports: [PrismaModule],
})
export class ClassGroupsModule {}
