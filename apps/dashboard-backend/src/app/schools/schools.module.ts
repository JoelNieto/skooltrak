import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { SchoolsController } from './schools.controller';
import { SchoolsResolver } from './schools.resolver';
import { SchoolsService } from './schools.service';

@Module({
  controllers: [SchoolsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [SchoolsResolver] : []),
    SchoolsService,
  ],
  imports: [PrismaModule, ConfigModule],
  exports: [SchoolsService],
})
export class SchoolsModule {}
