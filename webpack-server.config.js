const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function() {
  return {
    target: 'node',
    externals: [nodeExternals()],
    entry: [
      path.resolve(__dirname, 'src/js/Server.js')
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
                  ecmaVersion: 7,
                  sourceType: 'module',
                  ecmaFeatures: {
                    modules: true,
                    classes: true
                  }
                },
                globals: [
                  'require',
                  'module',
                  'console',
                  '__dirname',
                  'Promise',
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
