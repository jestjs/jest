// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

module.exports = function(tests) {
  return new Promise((resolve, reject) => {
    reject(new Error('My broken filter error.'));
  });
};
