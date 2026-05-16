import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { DegreesController } from './degrees.controller';
import { DegreesResolver } from './degrees.resolver';
import { DegreesService } from './degrees.service';

@Module({
  controllers: [DegreesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [DegreesResolver] : []),
    DegreesService,
  ],
  imports: [PrismaModule],
})
export class DegreesModule {}
