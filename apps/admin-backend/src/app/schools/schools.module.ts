import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module';
import { SchoolsResolver } from './schools.resolver';
import { SchoolsService } from './schools.service';

@Module({
  imports: [PrismaModule],
  providers: [SchoolsResolver, SchoolsService],
})
export class SchoolsModule {}
