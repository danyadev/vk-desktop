const electron = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, { mode }) => {
  const isDev = mode == 'development';

  return {
    mode,
    target: 'electron-renderer',
    stats: { children: false },
    optimization: {
      minimizer: [
        new TerserWebpackPlugin({
          cache: true,
          parallel: true,
          terserOptions: {
            ecma: 8,
            output: {
              comments: false
            },
            compress: {
              arguments: true,
              ecma: 8,
              warnings: true,
              keep_fargs: false,
              toplevel: true,
              unsafe: true,
              unsafe_arrows: true,
              unsafe_comps: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true
            }
          }
        }),
        new OptimizeCSSAssetsWebpackPlugin()
      ]
    },
    entry: './src/main.js',
    output: {
      publicPath: 'dist/',
      filename: 'bundle.js'
    },
    devServer: {
      clientLogLevel: 'none',
      compress: true,
      overlay: true,
      before(app, { middleware }) {
        middleware.waitUntilValid(() => {
          spawn(electron, [path.join(__dirname, './index.js'), 'dev-mode']);
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
            'css-loader'
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.(png|svg|gif|ttf)$/,
          loader: 'file-loader',
          options: {
            publicPath: 'assets/',
            outputPath: 'assets/',
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
    },
    node: {
      __dirname: true
    }
  };
}
