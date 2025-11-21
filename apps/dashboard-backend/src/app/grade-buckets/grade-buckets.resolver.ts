import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateGradeBucketInput } from './dto/create-grade-bucket.input';
import { UpdateGradeBucketInput } from './dto/update-grade-bucket.input';
import { GradeBucket } from './entities/grade-bucket.entity';
import { GradeBucketsService } from './grade-buckets.service';

@Resolver(() => GradeBucket)
export class GradeBucketsResolver {
  constructor(private readonly gradeBucketsService: GradeBucketsService) {}

  @Mutation(() => GradeBucket)
  createGradeBucket(
    @Args('createGradeBucketInput')
    createGradeBucketInput: CreateGradeBucketInput
  ) {
    return this.gradeBucketsService.create(createGradeBucketInput);
  }

  @Query(() => [GradeBucket], { name: 'gradeBucketsByCourseId' })
  findManyByCourseId(
    @Args('courseId', { type: () => String }) courseId: string
  ) {
    return this.gradeBucketsService.findManyByCourseId(courseId);
  }

  @Query(() => GradeBucket, { name: 'gradeBucket' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.gradeBucketsService.findOne(id);
  }

  @Mutation(() => GradeBucket)
  updateGradeBucket(
    @Args('updateGradeBucketInput')
    updateGradeBucketInput: UpdateGradeBucketInput
  ) {
    return this.gradeBucketsService.update(
      updateGradeBucketInput.id,
      updateGradeBucketInput
    );
  }

  @Mutation(() => GradeBucket)
  removeGradeBucket(@Args('id', { type: () => String }) id: string) {
    return this.gradeBucketsService.remove(id);
  }
}
