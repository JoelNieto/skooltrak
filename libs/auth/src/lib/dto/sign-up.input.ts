import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @Field(() => String, { description: 'Verification token from email link' })
  @IsNotEmpty()
  token: string;

  @Field(() => String, { description: 'Email of the user (must match token)' })
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
}
