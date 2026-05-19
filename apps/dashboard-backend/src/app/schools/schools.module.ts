import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma.module';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

@Module({
  controllers: [SchoolsController],
  providers: [
    SchoolsService,
  ],
  imports: [PrismaModule, ConfigModule],
  exports: [SchoolsService],
})
export class SchoolsModule {}
