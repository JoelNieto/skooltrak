import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignUpInput {
    @IsNotEmpty()
  token: string;

    @IsEmail()
  @IsNotEmpty()
  email: string;

    @IsNotEmpty()
  firstName: string;

    @IsNotEmpty()
  lastName: string;

    @MinLength(8)
  @IsNotEmpty()
  password: string;
}
