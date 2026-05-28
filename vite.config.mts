/// <reference types="vitest/config" />
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, UserConfig } from 'vite'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'
import { collectUnusedCssVariables } from './build/collectUnusedCssVariables'
import { svgLoader } from './build/svgLoader'

export default defineConfig(async ({ mode }) => ({
  build: {
    target: ['chrome108', 'node16'],
    modulePreload: {
      polyfill: false
    },
    outDir: 'app/dist',
    reportCompressedSize: false
  },
  resolve: {
    tsconfigPaths: true
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __IS_MACOS__: process.platform === 'darwin'
  },
  plugins: [
    vueJsx({
      include: /\.tsx$/
    }),
    svgLoader({
      defaultImport: 'component'
    }),
    electron({
      entry: 'main-process/index.ts',
      vite: {
        build: {
          outDir: 'app',
          reportCompressedSize: false
        }
      }
    }),
    electronRenderer()
  ],
  css: {
    transformer: mode === 'production' ? 'lightningcss' : undefined,
    lightningcss: {
      unusedSymbols: mode === 'production' ? await collectUnusedCssVariables(mode) : undefined
    }
  },
  test: {
    isolate: false,
    pool: 'threads'
  }
}) satisfies UserConfig)
