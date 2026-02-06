import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CreateSchoolInput } from './dto/create-school.input';
import { SchoolLogoUploadInput } from './dto/school-logo-upload.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { SchoolLogoDownloadUrl, SchoolLogoUploadUrl } from './entities/school-logo-url.entity';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SCHOOLS)
@Resolver(() => School)
export class SchoolsResolver {
  constructor(private readonly schoolsService: SchoolsService) {}

  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @Mutation(() => School)
  createSchool(@Args('createSchoolInput') createSchoolInput: CreateSchoolInput) {
    return this.schoolsService.create(createSchoolInput);
  }

  @Query(() => [School], { name: 'schools' })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Query(() => School, { name: 'school' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.schoolsService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @Mutation(() => School)
  updateSchool(@Args('updateSchoolInput') updateSchoolInput: UpdateSchoolInput) {
    return this.schoolsService.update(updateSchoolInput.id, updateSchoolInput);
  }

  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @Mutation(() => School)
  removeSchool(@Args('id', { type: () => String }) id: string) {
    return this.schoolsService.remove(id);
  }

  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @Mutation(() => SchoolLogoUploadUrl, {
    description: 'Create a presigned URL for uploading a school logo',
  })
  createSchoolLogoUploadUrl(@Args('input') input: SchoolLogoUploadInput): Promise<SchoolLogoUploadUrl> {
    return this.schoolsService.createLogoUploadUrl(input);
  }

  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @Mutation(() => School, {
    description: 'Update only the logo of a school',
  })
  updateSchoolLogo(@Args('id', { type: () => String }) id: string, @Args('logo', { type: () => String }) logo: string) {
    return this.schoolsService.updateLogo(id, logo);
  }

  @Query(() => SchoolLogoDownloadUrl, {
    name: 'schoolLogoDownloadUrl',
    description: 'Get a presigned URL for downloading a school logo',
  })
  getSchoolLogoDownloadUrl(@Args('schoolId', { type: () => String }) schoolId: string): Promise<SchoolLogoDownloadUrl> {
    return this.schoolsService.createLogoDownloadUrl(schoolId);
  }

  @ResolveField(() => String, { nullable: true })
  async logoUrl(@Parent() school: School): Promise<string | null> {
    if (!school.logo) {
      return null;
    }
    const result = await this.schoolsService.getLogoUrl(school.logo);
    return result;
  }
}
