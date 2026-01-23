import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthPayload } from './auth.payload';
import { AuthService } from './auth.service';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { SignUpInput } from './dto/sign-up.input';
import { User } from './users/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthPayload)
  async signUp(@Args('input') input: SignUpInput) {
    return this.authService.signUp(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@Context() context: any) {
    return this.authService.getUser(context.req.user.userId);
  }
}
