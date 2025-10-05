import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { DegreesResolver } from './degrees.resolver';
import { DegreesService } from './degrees.service';

@Module({
  providers: [DegreesResolver, DegreesService],
  imports: [PrismaModule],
})
export class DegreesModule {}
