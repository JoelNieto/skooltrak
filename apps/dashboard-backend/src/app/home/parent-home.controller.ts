import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParentChildHome, ParentChildren } from './entities/parent-home.entity';
import { ParentHomeService } from './parent-home.service';

/** Parent home sections (HOM-001). Only the caller's linked children (BR-HOM-001.9). */
@ApiTags('home')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_GRADES)
@Controller('v1/home/parent')
export class ParentHomeController {
  constructor(private readonly parentHome: ParentHomeService) {}

  @Get('children')
  @ApiOperation({ summary: 'Parent home: linked children with alert counts (FR-HOM-001.18)' })
  children(@Req() req: AuthenticatedRequest): Promise<ParentChildren> {
    return this.parentHome.children(req.user);
  }

  @Get('child/:studentId')
  @ApiOperation({ summary: 'Parent home: alerts and KPIs of one linked child (FR-HOM-001.19, .20)' })
  child(@Req() req: AuthenticatedRequest, @Param('studentId') studentId: string): Promise<ParentChildHome> {
    return this.parentHome.child(req.user, studentId);
  }
}
