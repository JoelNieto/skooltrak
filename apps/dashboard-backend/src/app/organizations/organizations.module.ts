import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';

@Module({
  providers: [OrganizationsResolver, OrganizationsService],
  imports: [PrismaModule],
})
export class OrganizationsModule {}
