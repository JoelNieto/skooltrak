import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SchoolsModule } from '../schools/schools.module';
import { StoreCartItemResolver } from './store-cart-item.resolver';
import { StorePublicController } from './store-public.controller';
import { StoreController } from './store.controller';
import { StorePublicResolver } from './store-public.resolver';
import { StorePublicService } from './store-public.service';
import { StoreProductFieldsResolver } from './store-product-fields.resolver';
import { StoreResolver } from './store.resolver';
import { StoreService } from './store.service';

@Module({
  controllers: [StoreController, StorePublicController],
  imports: [PrismaModule, SchoolsModule],
  providers: [
    StoreService,
    ...(includeNestGraphQlResolvers
      ? [
          StoreResolver,
          StorePublicResolver,
          StoreProductFieldsResolver,
          StoreCartItemResolver,
        ]
      : []),
    StorePublicService,
  ],
  exports: [StoreService, StorePublicService],
})
export class StoreModule {}
