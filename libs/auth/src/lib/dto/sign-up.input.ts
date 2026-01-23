import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  // School fields (step 1)
  @Field(() => String, { description: 'Name of the school' })
  @IsNotEmpty()
  schoolName: string;

  @Field(() => String, { description: 'Short name of the school' })
  @IsNotEmpty()
  schoolShortName: string;

  // User fields (step 2)
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
}
