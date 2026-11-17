import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeacherSummary, TeacherToday } from './entities/teacher-home.entity';
import { TeacherHomeService } from './teacher-home.service';

/** Teacher home sections (HOM-001). Also needs a Teacher record in the caller's org (BR-HOM-001.7). */
@ApiTags('home')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_COURSES)
@Controller('v1/home/teacher')
export class TeacherHomeController {
  constructor(private readonly teacherHome: TeacherHomeService) {}

  @Get('today')
  @ApiOperation({ summary: "Teacher home: today's classes with attendance state (FR-HOM-001.6)" })
  today(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<TeacherToday> {
    return this.teacherHome.today(req.user, schoolId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Teacher home: KPIs scoped to own courses (FR-HOM-001.7)' })
  summary(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<TeacherSummary> {
    return this.teacherHome.summary(req.user, schoolId);
  }
}
