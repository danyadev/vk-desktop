const electron = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = (env, { mode }) => {
  let dev = mode == 'development';

  return {
    mode,
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
          use: ExtractTextPlugin.extract({ use: 'css-loader' })
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          loader: 'file-loader',
          options: { publicPath: './dist' }
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin('styles.css'),
      new VueLoaderPlugin()
    ]
  };
}
