module.exports = {
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
  transform: {
    '\\.[tj]s$': ['babel-jest', {configFile: require.resolve('./.babelrc')}],
  },
};
