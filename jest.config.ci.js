// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

'use strict';

// Object spread is just node 8
module.exports = Object.assign({}, require('./jest.config'), {
  coverageReporters: ['json'],
  reporters: [
    ['jest-junit', {output: 'reports/junit/js-test-results.xml'}],
    ['jest-silent-reporter', {useDots: true}],
  ],
});
