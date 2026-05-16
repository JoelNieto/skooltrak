/**
 * Nest-only: omit GraphQL resolvers when generating OpenAPI (`OPENAPI_EXPORT=true`).
 * Safe if this file is ever bundled for the browser: without `process`, resolvers stay enabled.
 */
export const includeNestGraphQlResolvers = !(
  typeof process !== 'undefined' && process.env?.['OPENAPI_EXPORT'] === 'true'
);
