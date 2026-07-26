import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Request } from '@nestjs/common';
import { ImportService, DryRunResult } from './imports.service';

@ApiTags('imports')
@Controller('api/v1/imports')
@UseGuards(BetterAuthGuard, PermissionsGuard)
export class ImportsController {
  constructor(private readonly importService: ImportService) {}

  @Post('dry-run')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Validar CSV sin escribir datos (dry-run)' })
  async dryRun(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('No autenticado');
    }
    return this.importService.dryRun(body.organizationId, body.schoolId, body.entityType, body.csvText, userId);
  }

  @Post(':jobId/commit')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Confirmar la importación de un dry-run previo' })
  async commit(@Request() req: any, @Param('jobId') jobId: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('No autenticado');
    }
    return this.importService.commit(jobId, userId);
  }

  @Get(':jobId')
  @RequirePermissions(Perm.MANAGE_STUDENTS)
  @ApiOperation({ summary: 'Obtener el estado de un trabajo de importación' })
  async getJob(@Param('jobId') jobId: string) {
    const result = await this.importService.getJob(jobId);
    return result;
  }
}
