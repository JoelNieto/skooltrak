import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BetterAuthGuard, PermissionsGuard } from './auth.guard';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './better-auth';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthSessionController } from './auth-session.controller';
import { OrgInvitationsAdminController, OrgInvitationsController } from './org-onboarding/org-onboarding.controller';
import { OrgOnboardingService } from './org-onboarding/org-onboarding.service';

@Module({
  controllers: [AuthSessionController, OrgInvitationsController, OrgInvitationsAdminController],
  providers: [
    AuthService,
    AuthTokenService,
    OrgOnboardingService,
    // Deny by default: every HTTP route in any app importing AuthModule requires an
    // authenticated user unless marked @AllowAnonymous(). Order matters — APP_GUARDs run in
    // registration order, so authentication populates req.user before permissions are checked.
    { provide: APP_GUARD, useClass: BetterAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationsModule,
    AuthService,
    AuthTokenService,
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
