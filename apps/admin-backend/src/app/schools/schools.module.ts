import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { SchoolsController } from './schools.controller';
import { SchoolsResolver } from './schools.resolver';
import { SchoolsService } from './schools.service';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [SchoolsResolver] : []),
    SchoolsService,
  ],
})
export class SchoolsModule {}
