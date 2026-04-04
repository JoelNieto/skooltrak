const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'web-store',



  exposes: {
    './routes': './apps/web-store/src/app/store.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  sharedMappings: ['@/shared', '@/ui', '@/auth', '@/client-auth'],

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Node-only; shareAll also adds @prisma/client/* secondaries — skip the whole tree
    (pkg) => typeof pkg === 'string' && pkg.startsWith('@prisma/client'),
    (pkg) => typeof pkg === 'string' && pkg.startsWith('@prisma/adapter-'),
    '@graphql-typed-document-node/core',
    'better-auth/adapters/prisma',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true
  }
});
