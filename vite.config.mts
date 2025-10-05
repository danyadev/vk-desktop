import path from 'path'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, UserConfig } from 'vite'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'
import { collectUnusedCssVariables } from './build/collectUnusedCssVariables'
import { svgLoader } from './build/svgLoader'

// eslint-disable-next-line import-x/no-unused-modules
export default defineConfig(async ({ mode }) => {
  const unusedSymbols = await collectUnusedCssVariables(mode)

  return {
    build: {
      target: ['chrome108', 'node16'],
      modulePreload: {
        polyfill: false
      },
      outDir: 'app/dist',
      reportCompressedSize: false,
      cssMinify: 'lightningcss'
    },
    esbuild: {
      legalComments: 'none'
    },
    resolve: {
      alias: {
        'main-process': path.resolve(__dirname, './main-process'),
        actions: path.resolve(__dirname, './src/actions'),
        assets: path.resolve(__dirname, './src/assets'),
        converters: path.resolve(__dirname, './src/converters'),
        env: path.resolve(__dirname, './src/env'),
        hooks: path.resolve(__dirname, './src/hooks'),
        lang: path.resolve(__dirname, './src/lang'),
        misc: path.resolve(__dirname, './src/misc'),
        model: path.resolve(__dirname, './src/model'),
        store: path.resolve(__dirname, './src/store'),
        ui: path.resolve(__dirname, './src/ui')
      }
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
          },
          esbuild: {
            legalComments: 'none'
          }
        }
      }),
      electronRenderer()
    ],
    css: {
      transformer: mode === 'production' ? 'lightningcss' : undefined,
      lightningcss: {
        unusedSymbols
      }
    },
    test: {
      isolate: false,
      pool: 'threads'
    }
  } satisfies UserConfig
})
