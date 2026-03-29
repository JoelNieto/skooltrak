import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StoreResolver } from './store.resolver';
import { StoreService } from './store.service';

@Module({
  imports: [PrismaModule],
  providers: [StoreService, StoreResolver],
  exports: [StoreService],
})
export class StoreModule {}
