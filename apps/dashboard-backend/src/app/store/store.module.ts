import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SchoolsModule } from '../schools/schools.module';
import { StorePublicResolver } from './store-public.resolver';
import { StorePublicService } from './store-public.service';
import { StoreResolver } from './store.resolver';
import { StoreService } from './store.service';

@Module({
  imports: [PrismaModule, SchoolsModule],
  providers: [StoreService, StoreResolver, StorePublicService, StorePublicResolver],
  exports: [StoreService, StorePublicService],
})
export class StoreModule {}
