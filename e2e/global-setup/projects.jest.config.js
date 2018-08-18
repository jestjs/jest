const path = require('path');

module.exports = {
  globalSetup: '<rootDir>/setup.js',
  projects: [
    {
      displayName: 'project-1',
      globalSetup: '<rootDir>/setup.js',
      rootDir: path.resolve(__dirname, './project-1'),
      testMatch: ['<rootDir>/**/*.test.js'],
    },
    {
      displayName: 'project-2',
      globalSetup: '<rootDir>/setup.js',
      rootDir: path.resolve(__dirname, './project-2'),
      testMatch: ['<rootDir>/**/*.test.js'],
    },
  ],
};
