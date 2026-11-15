import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentProgress, StudentToday, StudentWork } from './entities/student-home.entity';
import { StudentHomeService } from './student-home.service';

/** Student home sections (HOM-001). Also needs the caller's own Student record (BR-HOM-001.8); no studentId is accepted. */
@ApiTags('home')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_GRADES)
@Controller('v1/home/student')
export class StudentHomeController {
  constructor(private readonly studentHome: StudentHomeService) {}

  @Get('today')
  @ApiOperation({ summary: 'Student home: current and next class, today’s classes (FR-HOM-001.12)' })
  today(@Req() req: AuthenticatedRequest): Promise<StudentToday> {
    return this.studentHome.today(req.user);
  }

  @Get('work')
  @ApiOperation({ summary: 'Student home: upcoming and overdue work for the student’s group (FR-HOM-001.14)' })
  work(@Req() req: AuthenticatedRequest): Promise<StudentWork> {
    return this.studentHome.work(req.user);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Student home: KPIs, course averages on the study plan scale, recent grades, habits (FR-HOM-001.13, .16, .17)' })
  progress(@Req() req: AuthenticatedRequest): Promise<StudentProgress> {
    return this.studentHome.progress(req.user);
  }
}
