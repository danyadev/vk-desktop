import { defineConfig } from 'vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import electron from 'vite-plugin-electron';

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  build: {
    target: 'es2021',
    polyfillModulePreload: false,
    outDir: 'app/dist'
  },
  plugins: [
    vueJsx({
      include: /\.[jt]sx$/
    }),
    electron({
      main: {
        entry: 'main-process/index.ts',
        vite: {
          build: {
            // sourcemap: 'inline',
            outDir: 'app/dist'
          }
        }
      },
      renderer: {}
    })
  ]
});
