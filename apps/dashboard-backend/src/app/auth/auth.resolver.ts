import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthPayload } from './auth.payload';
import { AuthService } from './auth.service';

import { UseGuards } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from './auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@Context() context: any) {
    return this.authService.getUser(context.req.user.userId);
  }
}
