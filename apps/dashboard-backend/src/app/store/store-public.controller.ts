import { AllowAnonymous, BetterAuthGuard } from '@/auth';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorePublicService } from './store-public.service';

/** Anonymous-friendly catalog (replaces GraphQL publicStore* queries). */
@ApiTags('store-public')
@Controller('v1/store/public')
@UseGuards(BetterAuthGuard)
export class StorePublicController {
  constructor(private readonly storePublic: StorePublicService) {}

  @Get('schools')
  @AllowAnonymous()
  @ApiOperation({ summary: 'School directory for store' })
  publicSchoolsForStore() {
    return this.storePublic.publicSchoolsDirectory();
  }

  @Get('schools/by-slug/:slug')
  @AllowAnonymous()
  @ApiOperation({ summary: 'School by slug' })
  publicSchoolBySlug(@Param('slug') slug: string) {
    return this.storePublic.schoolBySlug(slug);
  }

  @Get('categories')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Public categories' })
  publicStoreCategories(@Query('schoolId') schoolId: string) {
    return this.storePublic.publicStoreCategories(schoolId);
  }

  @Get('products')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Public products' })
  publicStoreProducts(
    @Query('schoolId') schoolId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.storePublic.publicStoreProducts(schoolId, search, categoryId);
  }

  @Get('products/:id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Public product by id' })
  publicStoreProduct(@Param('id') id: string) {
    return this.storePublic.publicStoreProduct(id);
  }
}
