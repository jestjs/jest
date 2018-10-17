module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        polyfill: false,
        regenerator: true,
      },
    ],
  ],
  presets: ['@babel/preset-env'],
};
