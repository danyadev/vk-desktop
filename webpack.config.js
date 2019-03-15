const electron = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, { mode }) => {
  let dev = mode == 'development';

  return {
    mode,
    target: 'electron-renderer',
    entry: {
      main: './src/main.js'
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath: dev ? 'http://localhost:8080/dist/' : '/dist/',
      filename: '[name].js'
    },
    devServer: {
      overlay: true,
      clientLogLevel: 'none',
      before(app, { middleware }) {
        middleware.waitUntilValid(() => {
          spawn(electron, [path.join(__dirname, './index.js'), 'dev-mode']);
        });
      }
    },
    devtool: dev ? 'eval-sourcemap' : false,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            dev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        }
      ]
    },
    plugins: [
      new CopyPlugin([
        { from: 'src/assets', to: 'assets' }
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new VueLoaderPlugin()
    ],
    resolve: {
      alias: {
        js: path.resolve(__dirname, 'src/js/'),
        'package-json': path.resolve(__dirname, 'package.json')
      }
    }
  };
}
