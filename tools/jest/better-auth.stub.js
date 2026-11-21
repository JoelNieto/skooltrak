/**
 * Jest stand-in for `better-auth` and `@thallesp/nestjs-better-auth`.
 *
 * Both packages ship ESM only, which ts-jest (CommonJS) cannot load, so any spec that imports
 * `@/auth` failed with "Cannot use import statement outside a module". The backend Jest configs
 * map those packages here. It covers only what `libs/auth` touches when it is imported; a spec
 * that needs real auth behaviour should `jest.mock()` the pieces it uses.
 */
const noopDecorator = () => () => undefined;

class AuthModule {
  static forRoot() {
    return { module: AuthModule };
  }
}

module.exports = {
  // better-auth, better-auth/adapters/prisma, better-auth/plugins
  betterAuth: () => ({ api: {}, options: {}, handler: () => undefined }),
  prismaAdapter: () => ({}),
  magicLink: () => ({}),
  organization: () => ({}),
  // @thallesp/nestjs-better-auth
  AuthModule,
  Session: noopDecorator,
};
