const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'web-shell',

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  sharedMappings: ['@/shared', '@/ui', '@/auth', '@/client-auth'],

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    (pkg) => typeof pkg === 'string' && pkg.startsWith('@prisma/client'),
    (pkg) => typeof pkg === 'string' && pkg.startsWith('@prisma/adapter-'),
    '@graphql-typed-document-node/core',
    'better-auth/adapters/prisma',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
