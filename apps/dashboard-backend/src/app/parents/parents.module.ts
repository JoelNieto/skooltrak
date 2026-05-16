import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ParentsController } from './parents.controller';
import { ParentsResolver } from './parents.resolver';
import { ParentsService } from './parents.service';

@Module({
  controllers: [ParentsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [ParentsResolver] : []),
    ParentsService,
  ],
  imports: [PrismaModule],
  exports: [ParentsService],
})
export class ParentsModule {}
