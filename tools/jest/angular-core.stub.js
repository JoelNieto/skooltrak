/**
 * Jest stand-in for `@angular/core` in the backend specs.
 *
 * The `@/shared` barrel also exports a front-end service (`school-context.ts`) that imports
 * `@angular/core`, whose ESM build ts-jest (CommonJS) cannot load. The backends never use Angular,
 * so this covers only what that import needs at load time. See tools/jest/better-auth.stub.js for
 * the same approach.
 */
module.exports = {
  Injectable: () => () => undefined,
  signal: (value) => {
    const read = () => value;
    read.set = (next) => {
      value = next;
    };
    read.asReadonly = () => read;
    return read;
  },
};
