import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminHomeService } from './admin-home.service';
import { AdminAttention, AdminKpis } from './entities/admin-home.entity';

/** School admin home sections (HOM-001). `schoolId` must belong to the caller's organization (BR-HOM-001.10). */
@ApiTags('home')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SCHOOL_DASHBOARD)
@Controller('v1/home/admin')
export class AdminHomeController {
  constructor(private readonly adminHome: AdminHomeService) {}

  @Get('attention')
  @ApiOperation({ summary: 'Admin home: attention tiles and period-close banner (FR-HOM-001.5, .24)' })
  attention(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<AdminAttention> {
    return this.adminHome.attention(req.user, schoolId);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Admin home: KPI row (FR-HOM-001.25)' })
  kpis(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<AdminKpis> {
    return this.adminHome.kpis(req.user, schoolId);
  }
}
