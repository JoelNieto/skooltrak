import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ParentsController } from './parents.controller';
import { ParentsSelfController } from './parents-self.controller';
import { ParentsService } from './parents.service';

@Module({
  controllers: [ParentsController, ParentsSelfController],
  providers: [
    ParentsService,
  ],
  imports: [PrismaModule],
  exports: [ParentsService],
})
export class ParentsModule {}
