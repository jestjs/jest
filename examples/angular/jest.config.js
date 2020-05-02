module.exports = {
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
  transform: {
    '^.+\\.[t|j]s$': [
      'babel-jest',
      {configFile: require.resolve('./.babelrc')},
    ],
  },
};
