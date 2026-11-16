import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Component styles use flat fills (tools/eslint-rules/rules/flat-styles.ts).
      '@nx/workspace-flat-styles': 'error',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // Templates use libs/ui primitives and design tokens (tools/eslint-rules/rules/design-tokens.ts).
      '@nx/workspace-design-tokens': 'error',
    },
  },
];
