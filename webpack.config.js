const electron = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = (env, { mode }) => {
  const isDev = mode == 'development';

  return {
    mode,
    target: 'electron-renderer',
    stats: { children: false },
    optimization: {
      minimizer: [
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
      ]
    },
    entry: './src/main.js',
    output: {
      publicPath: 'http://localhost:8080/dist',
      filename: 'bundle.js'
    },
    devServer: {
      clientLogLevel: 'silent',
      compress: true,
      overlay: true,
      before(app, { middleware }) {
        middleware.waitUntilValid(() => {
          spawn(electron, [path.join(__dirname, './index.js'), 'dev-mode'], { stdio: 'inherit' });
        });
      }
    },
    devtool: isDev ? 'eval-sourcemap' : false,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            ...(isDev ? [] : ['clean-css-loader?level=2'])
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            productionMode: !isDev
          }
        },
        {
          test: /\.(png|webp|svg|gif|ttf)$/,
          loader: 'file-loader',
          options: {
            publicPath: 'assets/',
            name: '[name].[ext]',
            emitFile: false
          }
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({ filename: 'bundle.css' }),
      new CopyWebpackPlugin([
        { from: 'index.html', to: 'index.html' },
        { from: 'src/assets', to: 'assets' }
      ])
    ],
    resolve: {
      alias: {
        'package-json': path.resolve(__dirname, 'package.json'),
        js: path.resolve(__dirname, 'src/js/'),
        assets: path.resolve(__dirname, 'src/assets/')
      }
    }
  };
}
