import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Shared list/pagination query for REST endpoints (replaces GraphQL FetchDataInput). */
export class FetchDataQueryDto {
  @ApiPropertyOptional({ description: 'Page', default: 1, type: 'integer' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Take / page size', default: 10, type: 'integer' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;

  get skip(): number {
    return (Number(this.page) - 1) * Number(this.pageSize);
  }

  @ApiPropertyOptional({ description: 'Order by field' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Order direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'School ID filter' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: 'Organization ID filter (admin)' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Search query', default: '' })
  @IsOptional()
  @IsString()
  search?: string = '';

  @ApiPropertyOptional({ description: 'Study plan ID filter' })
  @IsOptional()
  @IsString()
  studyPlanId?: string;

  @ApiPropertyOptional({ description: 'Course ID filter (e.g. files for course)' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Degree ID filter (e.g. files for course)' })
  @IsOptional()
  @IsString()
  degreeId?: string;

  @ApiPropertyOptional({ description: 'Teacher ID filter (e.g. files for teacher)' })
  @IsOptional()
  @IsString()
  teacherId?: string;
}
