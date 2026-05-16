import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateNewsletterInput } from './dto/create-newsletter.input';
import { UpdateNewsletterInput } from './dto/update-newsletter.input';
import { NewslettersService } from './newsletters.service';

@ApiTags('newsletters')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_NEWSLETTER)
@Controller('v1/newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @ApiOperation({ summary: 'Create newsletter' })
  create(@Body() createNewsletterInput: CreateNewsletterInput) {
    return this.newslettersService.create(createNewsletterInput);
  }

  @Get('count')
  @ApiOperation({ summary: 'Newsletters count' })
  findManyNewslettersCount(@Query() query: FetchDataQueryDto) {
    return this.newslettersService.findCount(toFetchDataInput(query));
  }

  @Get('published')
  @ApiOperation({ summary: 'Published newsletters for school' })
  findPublished(@Query('schoolId') schoolId: string, @Query('take') take?: string) {
    return this.newslettersService.findPublished(schoolId, take != null ? Number(take) : 3);
  }

  @Get()
  @ApiOperation({ summary: 'List newsletters' })
  findAll(@Query() query: FetchDataQueryDto) {
    return this.newslettersService.findAll(toFetchDataInput(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get newsletter by id' })
  findOne(@Param('id') id: string) {
    return this.newslettersService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @ApiOperation({ summary: 'Update newsletter' })
  update(@Body() updateNewsletterInput: UpdateNewsletterInput) {
    return this.newslettersService.update(updateNewsletterInput.id, updateNewsletterInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @ApiOperation({ summary: 'Delete newsletter' })
  remove(@Param('id') id: string) {
    return this.newslettersService.remove(id);
  }
}
