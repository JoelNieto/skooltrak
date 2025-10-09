import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthPayload } from './auth.payload';
import { AuthService } from './auth.service';

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
}
