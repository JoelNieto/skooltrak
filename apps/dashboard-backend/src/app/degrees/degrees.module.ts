import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { DegreesController } from './degrees.controller';
import { DegreesService } from './degrees.service';

@Module({
  controllers: [DegreesController],
  providers: [
    DegreesService,
  ],
  imports: [PrismaModule],
})
export class DegreesModule {}
