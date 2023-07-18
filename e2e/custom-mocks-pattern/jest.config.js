const path = require('node:path');

/** @type {import('jest').Config} */
const config = {
  customMockPath: path.resolve(__dirname, 'myMocks'),
};

module.exports = config;
