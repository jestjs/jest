module.exports = {
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
  testEnvironment: 'jsdom',
  transform: {
    '\\.[tj]s$': ['babel-jest', {configFile: require.resolve('./.babelrc')}],
  },
};
