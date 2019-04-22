// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

module.exports = function(tests) {
  return {
    filtered: tests.filter(t => t.indexOf('foo') !== -1).map(test => ({test})),
  };
};

module.exports.setup = function() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('My broken setup filter error.'));
    }, 0);
  });
};
