import { includeNestGraphQlResolvers } from './nest-graphql-flags';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './better-auth';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthSessionController } from './auth-session.controller';

@Module({
  controllers: [AuthSessionController],
  providers: [
    AuthService,
    ...(includeNestGraphQlResolvers ? [AuthResolver] : []),
  ],
  exports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationsModule,
    AuthService,
  ],
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    PrismaModule,
    BetterAuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    OrganizationsModule,
  ],
})
export class AuthModule {}
