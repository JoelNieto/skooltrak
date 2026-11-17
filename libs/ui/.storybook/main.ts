import type { StorybookConfig } from '@storybook/angular';
import { createRequire } from 'node:module';

// Use the webpack instance that actually compiles the stories (Storybook's builder bundles its own
// copy), so the plugin below is the same class the compiler expects.
const require = createRequire(import.meta.url);
const webpack: typeof import('webpack') = require(
  require.resolve('webpack', { paths: [require.resolve('@storybook/builder-webpack5')] }),
);

const config: StorybookConfig = {
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook'
  ],
  // Brand logos and icons, served at /brand/ as in the apps (ui-brand-logo).
  staticDirs: [{ from: '../src/assets/brand', to: '/brand' }],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  webpackFinal: async (webpackConfig) => {
    // Angular 22 reads the `ngServerMode` global at bootstrap. The Angular CLI only defines it in its
    // minifier, which Storybook doesn't run, so without this every story fails with
    // "ReferenceError: ngServerMode is not defined".
    webpackConfig.plugins ??= [];
    webpackConfig.plugins.push(new webpack.DefinePlugin({ ngServerMode: false }) as never);
    return webpackConfig;
  },
};

export default config;
