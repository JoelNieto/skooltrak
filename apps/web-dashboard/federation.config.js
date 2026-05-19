const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'web-dashboard',

  exposes: {
    './routes': './apps/web-dashboard/src/app/dashboard.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  sharedMappings: [],

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
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
