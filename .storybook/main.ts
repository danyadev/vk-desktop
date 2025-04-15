import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },
  async viteFinal(config) {
    // Добавляем поддержку JSX
    config.plugins = config.plugins || [];
    config.plugins.push({
      name: 'enable-jsx',
      config() {
        return {
          esbuild: {
            jsx: 'automatic',
          },
        };
      },
    });
    return config;
  },
};

export default config;
