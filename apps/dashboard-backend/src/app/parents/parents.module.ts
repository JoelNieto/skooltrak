import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ParentsResolver } from './parents.resolver';
import { ParentsService } from './parents.service';

@Module({
  providers: [ParentsResolver, ParentsService],
  imports: [PrismaModule],
  exports: [ParentsService],
})
export class ParentsModule {}
