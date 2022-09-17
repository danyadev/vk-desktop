const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const { DefinePlugin } = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = function(env, { mode = 'development' } = {}) {
  const isDev = mode === 'development';
  const minimizer = [];

  if (!isDev) {
    minimizer.push(
      new TerserWebpackPlugin({
        extractComments: false,
        terserOptions: {
          ecma: 8,
          module: true,
          compress: {
            keep_fargs: false,
            passes: 2,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_methods: true,
            unsafe_proto: true
          },
          output: {
            comments: false
          }
        }
      })
    );
  }

  return {
    mode,
    target: 'electron-renderer',
    stats: {
      children: false
    },
    optimization: {
      minimizer
    },
    entry: {
      main: './src/main.ts'
    },
    output: {
      path: path.resolve(__dirname, 'app/dist/'),
      publicPath: 'http://localhost:9973/dist/',
      pathinfo: false
    },
    devServer: {
      compress: true,
      port: 9973,

      client: {
        logging: 'warn'
      },

      setupMiddlewares(middlewares, { middleware }) {
        middleware.waitUntilValid(() => {
          spawn(
            electron,
            [path.join(__dirname, './main-process/index.js'), 'dev-mode'],
            { stdio: 'inherit' }
          ).on('close', process.exit);
        });

        return middlewares;
      }
    },
    devtool: isDev ? 'eval-source-map' : false,
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false
              }
            },
            {
              loader: 'css-loader',
              options: {
                esModule: false
              }
            }
          ]
        },
        {
          test: /\.(png|webp|svg|gif|woff2)$/,
          loader: 'file-loader',
          options: {
            publicPath: 'assets/',
            name: '[name].[ext]',
            emitFile: false,
            esModule: false
          }
        }
      ]
    },
    plugins: [
      new DefinePlugin({
        DEV_MODE: JSON.stringify(isDev),
        API_HOST: JSON.stringify('danyadev.ru'),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'main-process/main.html', to: 'main.html' }
          // { from: 'src/assets', to: 'assets' }
        ]
      })
    ],

    externals: {
      '@electron/remote': `
        /* module.exports = */ require('@electron/remote');
        module.exports.default = require('@electron/remote');
      `
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      symlinks: false
    }
  };
};
