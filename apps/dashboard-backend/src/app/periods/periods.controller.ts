import { AuthenticatedRequest, AuthUserContext } from '@/auth';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePeriodInput } from './dto/create-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { PeriodsService } from './periods.service';

export const PERIODS_PLATFORM_ONLY = 'Los periodos se gestionan desde la administración de la plataforma';

/** Periods are shared by every organization: any signed-in user reads them, only SYSADMIN changes them. */
function assertSysadmin(user: AuthUserContext | undefined): void {
  if (user?.role?.toUpperCase() !== 'SYSADMIN') throw new ForbiddenException(PERIODS_PLATFORM_ONLY);
}

@ApiTags('periods')
@Controller('v1/periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create period' })
  async create(@Req() req: AuthenticatedRequest, @Body() createPeriodInput: CreatePeriodInput) {
    assertSysadmin(req.user);
    return this.periodsService.create(createPeriodInput);
  }

  @Get()
  @ApiOperation({ summary: 'List periods' })
  findAll() {
    return this.periodsService.findAll();
  }

  @Get('by-year')
  @ApiOperation({ summary: 'Periods by year' })
  findManyByYear(@Query('year') year: string) {
    return this.periodsService.findManyByYear(Number(year));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period by id' })
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update period' })
  async update(@Req() req: AuthenticatedRequest, @Body() updatePeriodInput: UpdatePeriodInput) {
    assertSysadmin(req.user);
    return this.periodsService.update(updatePeriodInput.id, updatePeriodInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete period' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    assertSysadmin(req.user);
    return this.periodsService.remove(id);
  }
}
