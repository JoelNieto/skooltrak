import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
  ],
  imports: [PrismaModule],
})
export class OrganizationsModule {}
