// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

const setupData = {
  filterText: 'this will return no tests',
};

module.exports = function(tests) {
  return {
    filtered: tests
      .filter(t => t.indexOf(setupData.filterText) !== -1)
      .map(test => ({test})),
  };
};

module.exports.setup = function() {
  setupData.filterText = 'foo';
};
