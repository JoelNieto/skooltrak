import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationsResolver, OrganizationsService],
})
export class OrganizationsModule {}
