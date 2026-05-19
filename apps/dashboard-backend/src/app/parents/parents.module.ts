import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';

@Module({
  controllers: [ParentsController],
  providers: [
    ParentsService,
  ],
  imports: [PrismaModule],
  exports: [ParentsService],
})
export class ParentsModule {}
