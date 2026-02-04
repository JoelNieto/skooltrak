import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  // User fields (required)
  @Field(() => String, { description: 'Email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => String, { description: 'First name of the user' })
  @IsNotEmpty()
  firstName: string;

  @Field(() => String, { description: 'Last name of the user' })
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { description: 'Password of the user' })
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  // School fields (optional - created during onboarding)
  @Field(() => String, { nullable: true, description: 'Name of the school (optional)' })
  @IsOptional()
  schoolName?: string;

  @Field(() => String, { nullable: true, description: 'Short name of the school (optional)' })
  @IsOptional()
  schoolShortName?: string;
}
