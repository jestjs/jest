'use strict';

// Object spread is just node 8
module.exports = Object.assign({}, require('./jest.config'), {
  coverageReporters: ['json'],
  reporters: [
    'default',
    ['jest-junit', {output: 'reports/junit/js-test-results.xml'}],
  ],
});
