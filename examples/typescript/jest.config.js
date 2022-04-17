// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

module.exports = {
  testEnvironment: 'jsdom',

  transform: {
    '\\.js$': [require.resolve('babel-jest'), {cwd: __dirname}],
  },
};
