import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SchoolsModule } from './schools/schools.module';
import { RolesModule } from './roles/roles.module';
import { SubjectsModule } from './subjects/subjects.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [ConfigModule],
      useFactory: async () => ({
        autoSchemaFile: join(process.cwd(), 'schema.gql'),
        sortSchema: true,
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        path: '/api/graphql',
      }),
      driver: ApolloDriver,
    }),
    OrganizationsModule,
    SchoolsModule,
    RolesModule,
    SubjectsModule,
    UsersModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
