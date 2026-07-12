import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ParentsSelfController } from './parents-self.controller';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';

@Module({
  controllers: [ParentsSelfController, ParentsController],
  providers: [ParentsService],
  imports: [PrismaModule],
  exports: [ParentsService],
})
export class ParentsModule {}
