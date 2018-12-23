const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function() {
  return {
    target: 'node',
    externals: [nodeExternals()],
    entry: [
      'babel-polyfill',
      path.resolve(__dirname, 'src/js/server/index.js')
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'server.js',
      library: '',
      libraryTarget: 'commonjs2'
    },
    resolve: {
      alias: {
        js: path.resolve(__dirname, 'src/js'),
      },
      extensions: ['.js']
    },
    module: {
      rules: [
        {
          test: /(\.js)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader'
            },
            {
              loader: 'eslint-loader',
              options: {
                rules: {
                  'no-console': 0
                },
                parserOptions: {
                  ecmaVersion: 8,
                  sourceType: 'module',
                  ecmaFeatures: {
                    modules: true,
                    classes: true,
                    experimentalObjectRestSpread: true
                  }
                },
                globals: [
                  'require',
                  'module',
                  'console',
                  '__dirname',
                  'Promise',
                  'setTimeout'
                ],
                baseConfig: {
                  extends: ['eslint:recommended']
                }
              }
            }
          ]
        }
      ]
    }
  };
};
