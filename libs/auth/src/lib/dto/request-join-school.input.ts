import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class RequestJoinSchoolInput {
  @Field(() => String, { description: 'ID of the school to join' })
  @IsNotEmpty()
  schoolId: string;

  @Field(() => String, { description: 'Requested role: ORG_ADMIN, TEACHER, STUDENT, PARENT' })
  @IsNotEmpty()
  requestedRole: string;

  @Field(() => String, { nullable: true, description: 'Document ID (required for STUDENT and PARENT)' })
  @IsOptional()
  documentId?: string;
}
