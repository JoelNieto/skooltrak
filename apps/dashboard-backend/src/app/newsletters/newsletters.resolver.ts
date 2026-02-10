import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateNewsletterInput } from './dto/create-newsletter.input';
import { UpdateNewsletterInput } from './dto/update-newsletter.input';
import { Newsletter } from './entities/newsletter.entity';
import { NewslettersService } from './newsletters.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_NEWSLETTER)
@Resolver(() => Newsletter)
export class NewslettersResolver {
  constructor(private readonly newslettersService: NewslettersService) {}

  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @Mutation(() => Newsletter)
  createNewsletter(
    @Args('createNewsletterInput') createNewsletterInput: CreateNewsletterInput,
  ) {
    return this.newslettersService.create(createNewsletterInput);
  }

  @Query(() => [Newsletter], { name: 'newsletters' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.newslettersService.findAll(fetchDataInput);
  }

  @Query(() => Int, { name: 'findManyNewslettersCount' })
  findManyNewslettersCount(@Args() fetchDataInput: FetchDataInput) {
    return this.newslettersService.findCount(fetchDataInput);
  }

  @Query(() => [Newsletter], { name: 'publishedNewsletters' })
  findPublished(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('take', { type: () => Int, defaultValue: 3 }) take: number,
  ) {
    return this.newslettersService.findPublished(schoolId, take);
  }

  @Query(() => Newsletter, { name: 'newsletter', nullable: true })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.newslettersService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @Mutation(() => Newsletter)
  updateNewsletter(
    @Args('updateNewsletterInput') updateNewsletterInput: UpdateNewsletterInput,
  ) {
    return this.newslettersService.update(
      updateNewsletterInput.id,
      updateNewsletterInput,
    );
  }

  @RequirePermissions(Perm.MANAGE_NEWSLETTER)
  @Mutation(() => Newsletter)
  removeNewsletter(@Args('id', { type: () => String }) id: string) {
    return this.newslettersService.remove(id);
  }
}
