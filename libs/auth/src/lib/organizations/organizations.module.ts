import { includeNestGraphQlResolvers } from '../nest-graphql-flags';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [OrganizationsResolver] : []),
    OrganizationsService,
  ],
  imports: [PrismaModule],
})
export class OrganizationsModule {}
