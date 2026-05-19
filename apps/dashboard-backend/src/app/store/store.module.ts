import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SchoolsModule } from '../schools/schools.module';
import { StorePublicController } from './store-public.controller';
import { StoreController } from './store.controller';
import { StorePublicService } from './store-public.service';
import { StoreService } from './store.service';

@Module({
  controllers: [StoreController, StorePublicController],
  imports: [PrismaModule, SchoolsModule],
  providers: [
    StoreService,
    StorePublicService,
  ],
  exports: [StoreService, StorePublicService],
})
export class StoreModule {}
