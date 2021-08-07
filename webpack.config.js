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
    stats: { children: false },
    optimization: {
      minimizer
    },
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, 'app/dist'),
      publicPath: 'http://localhost:9973/dist',
      pathinfo: false
    },
    devServer: {
      compress: true,
      port: 9973,

      client: {
        logging: 'warn'
      },

      onBeforeSetupMiddleware({ middleware }) {
        middleware.waitUntilValid(() => {
          spawn(
            electron,
            [path.join(__dirname, './index.js'), 'dev-mode'],
            { stdio: 'inherit' }
          ).on('close', process.exit);
        });
      }
    },
    devtool: isDev ? 'eval-source-map' : false,
    module: {
      rules: [
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
        API_HOST: JSON.stringify('vk-desktop.herokuapp.com'),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({ filename: '[name].css' }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'index.html', to: 'index.html' },
          { from: 'src/assets', to: 'assets' }
        ]
      })
    ],
    resolve: {
      extensions: ['.js'],
      symlinks: false,
      alias: {
        assets: path.resolve(__dirname, 'src/assets'),
        css: path.resolve(__dirname, 'src/css'),
        js: path.resolve(__dirname, 'src/js'),
        lang: path.resolve(__dirname, 'src/lang')
      }
    }
  };
};
