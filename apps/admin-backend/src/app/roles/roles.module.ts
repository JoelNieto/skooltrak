import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';

@Module({
  imports: [PrismaModule],
  providers: [RolesResolver, RolesService],
})
export class RolesModule {}
