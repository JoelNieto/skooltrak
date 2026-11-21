module.exports = {
  displayName: 'admin-backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  setupFiles: ['<rootDir>/../../tools/jest/backend-env.setup.js'],
  // better-auth ships ESM only; see tools/jest/better-auth.stub.js.
  moduleNameMapper: {
    '^better-auth(/.*)?$': '<rootDir>/../../tools/jest/better-auth.stub.js',
    '^@thallesp/nestjs-better-auth$': '<rootDir>/../../tools/jest/better-auth.stub.js',
    // The @/shared barrel exports a front-end service; see tools/jest/angular-core.stub.js.
    '^@angular/core$': '<rootDir>/../../tools/jest/angular-core.stub.js',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/admin-backend',
};
