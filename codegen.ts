import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.gql',
  documents: [
    'apps/web-dashboard/src/app/graphql/operations/**/*.graphql',
    'apps/web-admin/src/app/graphql/operations/**/*.graphql',
    'apps/web-store/src/app/graphql/operations/**/*.graphql',
  ],
  generates: {
    'apps/web-dashboard/src/app/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
      },
    },
    'apps/web-admin/src/app/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
      },
    },
    'apps/web-store/src/app/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
      },
    },
  },
};

export default config;
