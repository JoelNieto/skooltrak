import type { Decorator, Preview } from '@storybook/angular';

/** Mirrors ThemeService: the app theme lives in data-theme on <html>. */
const withTheme: Decorator = (story, context) => {
  document.documentElement.setAttribute('data-theme', context.globals['theme'] ?? 'light');
  return story();
};

const preview: Preview = {
  // Every component gets a Docs page: all its stories, each with a "Show code" toggle.
  tags: ['autodocs'],
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Design-token theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    backgrounds: { disable: true },
    docs: { source: { language: 'html' } },
    controls: { expanded: true },
    layout: 'padded',
  },
};

export default preview;
