// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

'use strict';

module.exports = function(tests) {
  return {
    filtered: tests.filter(t => t.indexOf('foo') !== -1).map(test => ({test})),
  };
};
