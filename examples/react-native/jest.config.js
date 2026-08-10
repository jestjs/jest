const {resolve} = require('node:path');

module.exports = {
  preset: '@react-native/jest-preset',
  testEnvironmentOptions: {
    globalsCleanup: 'soft',
  },
  // this is specific to the Jest repo, not generally needed (the files we ignore will be in node_modules which is ignored by default)
  transformIgnorePatterns: [resolve(__dirname, '../../packages')],
};
