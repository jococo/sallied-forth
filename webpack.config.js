const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/ts/salliedforth.ts',
  output: {
    path: path.resolve(__dirname, 'build/js'),
    filename: 'salliedforth.min.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
