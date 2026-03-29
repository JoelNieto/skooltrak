import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

@InputType()
export class CreateStoreCategoryInput {
  @Field(() => String)
  @IsUUID()
  schoolId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(200)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
