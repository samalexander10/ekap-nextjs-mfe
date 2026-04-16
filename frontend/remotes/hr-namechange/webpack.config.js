const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'hrNamechange',
      filename: 'remoteEntry.js',
      exposes: { './NameChangeApp': './src/NameChangeApp' },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.3.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.3.0' },
      },
    }),
    new HtmlWebpackPlugin({ template: './index.html' }),
  ],
  devServer: {
    port: 3001,
    headers: { 'Access-Control-Allow-Origin': '*' },
    historyApiFallback: true,
  },
};
