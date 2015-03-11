var webpack = require('webpack');

module.exports = {

  devtool: 'inline-source-map',

  entry: {
    app: [
      'webpack-dev-server/client?http://localhost:8080',
      './main.jsx'
    ]
  },

  output: {
    path: './build',
    publicPath: '/assets/',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    alias: {},
    extensions: ['', '.js', '.jsx', '.json']
  },

  module: {
    noParse: [],
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /(\.js|\.jsx)$/, loaders: ['babel-loader', 'jsx-loader?harmony'], exclude: /node_modules/ }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('shared.js'),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]
}
