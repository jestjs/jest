'use strict';

// TODO: Configure the reporter directly: https://github.com/rickhanlonii/jest-silent-reporter/commit/e9a306210f89fa22705823f4c920ed4eecdfb83d#r30109923
process.env.JEST_SILENT_REPORTER_DOTS = true;

// Object spread is just node 8
module.exports = Object.assign({}, require('./jest.config'), {
  reporters: [
    ['jest-junit', {output: 'reports/junit/js-test-results.xml'}],
    'jest-silent-reporter',
  ],
});
