import path from 'path'
import { defineConfig } from 'vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'
import electron from 'vite-plugin-electron'

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  build: {
    target: 'es2021',
    polyfillModulePreload: false,
    outDir: 'app/dist'
  },
  resolve: {
    alias: {
      assets: path.resolve(__dirname, './src/assets'),
      env: path.resolve(__dirname, './src/env'),
      misc: path.resolve(__dirname, './src/misc'),
      model: path.resolve(__dirname, './src/model'),
      ui: path.resolve(__dirname, './src/ui')
    }
  },
  plugins: [
    vueJsx({
      include: /\.[jt]sx$/
    }),
    svgLoader({
      defaultImport: 'component'
    }),
    electron({
      main: {
        entry: 'main-process/index.ts',
        vite: {
          build: {
            // sourcemap: 'inline',
            outDir: 'app'
          }
        }
      },
      renderer: {}
    })
  ]
})
