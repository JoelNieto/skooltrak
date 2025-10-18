import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';

@Module({
  providers: [RolesResolver, RolesService],
  imports: [PrismaModule],
})
export class RolesModule {}
