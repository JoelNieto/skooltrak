import { Public } from '@/auth';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { StoreCategory } from './entities/store-category.entity';
import { StoreProduct } from './entities/store-product.entity';
import { PublicSchoolDirectoryEntry } from './entities/public-school-directory.entity';
import { StorePublicService } from './store-public.service';

@Resolver()
export class StorePublicResolver {
  constructor(private readonly storePublic: StorePublicService) {}

  @Public()
  @Query(() => [PublicSchoolDirectoryEntry], { name: 'publicSchoolsForStore' })
  publicSchoolsForStore() {
    return this.storePublic.publicSchoolsDirectory();
  }

  @Public()
  @Query(() => PublicSchoolDirectoryEntry, { name: 'publicSchoolBySlug' })
  async publicSchoolBySlug(@Args('slug', { type: () => String }) slug: string) {
    return this.storePublic.schoolBySlug(slug);
  }

  @Public()
  @Query(() => [StoreCategory], { name: 'publicStoreCategories' })
  publicStoreCategories(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storePublic.publicStoreCategories(schoolId);
  }

  @Public()
  @Query(() => [StoreProduct], { name: 'publicStoreProducts' })
  publicStoreProducts(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('categoryId', { type: () => String, nullable: true }) categoryId?: string,
  ) {
    return this.storePublic.publicStoreProducts(schoolId, search, categoryId);
  }

  @Public()
  @Query(() => StoreProduct, { name: 'publicStoreProduct', nullable: true })
  publicStoreProduct(@Args('id', { type: () => String }) id: string) {
    return this.storePublic.publicStoreProduct(id);
  }
}
