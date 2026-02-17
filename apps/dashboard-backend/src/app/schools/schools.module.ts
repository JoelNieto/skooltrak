import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { SchoolsResolver } from './schools.resolver';
import { SchoolsService } from './schools.service';

@Module({
  providers: [SchoolsResolver, SchoolsService],
  imports: [PrismaModule, ConfigModule],
  exports: [SchoolsService],
})
export class SchoolsModule {}
