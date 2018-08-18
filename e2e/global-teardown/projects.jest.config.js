const path = require('path');

module.exports = {
  globalTeardown: '<rootDir>/teardown.js',
  projects: [
    {
      displayName: 'project-1',
      globalTeardown: '<rootDir>/teardown.js',
      rootDir: path.resolve(__dirname, './project-1'),
      testMatch: ['<rootDir>/**/*.test.js'],
    },
    {
      displayName: 'project-2',
      globalTeardown: '<rootDir>/teardown.js',
      rootDir: path.resolve(__dirname, './project-2'),
      testMatch: ['<rootDir>/**/*.test.js'],
    },
  ],
};
