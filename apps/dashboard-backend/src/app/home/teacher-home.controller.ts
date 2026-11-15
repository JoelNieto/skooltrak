import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeacherAttention, TeacherSummary, TeacherToday, TeacherWeek } from './entities/teacher-home.entity';
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
  @ApiOperation({ summary: 'Teacher home: KPIs, Pendientes and period-close banner (FR-HOM-001.5, .7, .8)' })
  summary(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<TeacherSummary> {
    return this.teacherHome.summary(req.user, schoolId);
  }

  @Get('week')
  @ApiOperation({ summary: "Teacher home: this week's assignments with hand-in progress (FR-HOM-001.9)" })
  week(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<TeacherWeek> {
    return this.teacherHome.week(req.user, schoolId);
  }

  @Get('attention')
  @ApiOperation({ summary: 'Teacher home: students needing attention and unanswered family threads (FR-HOM-001.10, .11)' })
  attention(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<TeacherAttention> {
    return this.teacherHome.attention(req.user, schoolId);
  }
}
