// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

module.exports = {
  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: './setup.js',

  // A path to a module which exports an async function that is triggered once after all test suites
  globalTeardown: './teardown.js',

  // The test environment that will be used for testing
  testEnvironment: './mongo-environment.js',

  transformIgnorePatterns: ['/node_modules/', '/packages/'],
};
