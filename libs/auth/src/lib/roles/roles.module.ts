import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [
    RolesService,
  ],
  imports: [PrismaModule],
})
export class RolesModule {}
