import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSchoolInput } from './dto/create-school.input';
import { SchoolLogoUploadInput } from './dto/school-logo-upload.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { SchoolsService } from './schools.service';

@ApiTags('schools')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SCHOOLS)
@Controller('v1/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Create school' })
  create(@Body() createSchoolInput: CreateSchoolInput) {
    return this.schoolsService.create(createSchoolInput);
  }

  @Get()
  @ApiOperation({ summary: 'List schools' })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Post('logo-upload-url')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Presigned URL for logo upload' })
  createSchoolLogoUploadUrl(@Body() input: SchoolLogoUploadInput) {
    return this.schoolsService.createLogoUploadUrl(input);
  }

  @Get('logo-download-url')
  @ApiOperation({ summary: 'Presigned URL for logo download' })
  getSchoolLogoDownloadUrl(@Query('schoolId') schoolId: string) {
    return this.schoolsService.createLogoDownloadUrl(schoolId);
  }

  @Get(':id/presigned-logo-url')
  @ApiOperation({ summary: 'Resolve logo key to presigned URL (GraphQL logoUrl field)' })
  async getLogoUrl(@Param('id') id: string) {
    const school = await this.schoolsService.findOne(id);
    if (!school?.logo) return { url: null as string | null };
    const url = await this.schoolsService.getLogoUrl(school.logo);
    return { url };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get school by id' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Update school' })
  update(@Body() updateSchoolInput: UpdateSchoolInput) {
    return this.schoolsService.update(updateSchoolInput.id, updateSchoolInput);
  }

  @Patch(':id/logo')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Update school logo key' })
  updateSchoolLogo(@Param('id') id: string, @Body() body: { logo: string }) {
    return this.schoolsService.updateLogo(id, body.logo);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Delete school' })
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
