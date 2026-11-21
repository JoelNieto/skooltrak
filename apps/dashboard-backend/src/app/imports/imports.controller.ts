import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, ForbiddenException, Get, Param, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IMPORT_DENIED, ImportService } from './imports.service';

/** The caller's user and organization; imports never take the organization from the body. */
function actor(req: any): { userId: string; organizationId: string } {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedException('No autenticado');
  const organizationId = req.user?.organizationId;
  if (!organizationId) throw new ForbiddenException(IMPORT_DENIED);
  return { userId, organizationId };
}

@ApiTags('imports')
@Controller('v1/imports')
@UseGuards(BetterAuthGuard, PermissionsGuard)
export class ImportsController {
  constructor(private readonly importService: ImportService) {}

  @Post('dry-run')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Validar CSV sin escribir datos (dry-run)' })
  async dryRun(@Request() req: any, @Body() body: any) {
    const { userId, organizationId } = actor(req);
    return this.importService.dryRun(organizationId, body.schoolId, body.entityType, body.csvText, userId);
  }

  @Post(':jobId/commit')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Confirmar la importación de un dry-run previo' })
  async commit(@Request() req: any, @Param('jobId') jobId: string) {
    const { userId, organizationId } = actor(req);
    return this.importService.commit(jobId, userId, organizationId);
  }

  @Get(':jobId')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Obtener el estado de un trabajo de importación' })
  async getJob(@Request() req: any, @Param('jobId') jobId: string) {
    return this.importService.getJob(jobId, actor(req).organizationId);
  }
}
