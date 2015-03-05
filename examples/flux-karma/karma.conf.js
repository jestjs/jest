var webpack = require('webpack');
var RewirePlugin = require("rewire-webpack");

module.exports = function(config) {
  config.set({

    browsers: [ process.env.CONTINUOUS_INTEGRATION ? 'Firefox' : 'Chrome' ],

    singleRun: process.env.CONTINUOUS_INTEGRATION === 'true',

    frameworks: [ 'jasmine' ],

    files: [
      'tests.webpack.js'
    ],

    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ]
    },

    reporters: [ 'mocha' ],

    webpack: {
      devtool: 'inline-source-map',
      resolve: {
        alias: {},
        extensions: ['', '.js', '.jsx', '.json']
      },
      module: {
        loaders: [
          { test: /\.json$/, loader: 'json-loader' },
          { test: /(\.js|\.jsx)$/, loaders: ['babel-loader', 'jsx-loader?harmony'], exclude: /node_modules/ }
        ]
      },
      plugins: [
        new RewirePlugin(),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test')
        })
      ]
    },

    webpackServer: {
      noInfo: true
    }

  });
}