/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const { messageParent } = require('jest-worker');

module.exports = function() {
  const points = 10000;
  let inside = 0;
  messageParent({ r: 'Lucas' }) 

  for (let i = 0; i < points; i++) {
    if (Math.pow(Math.random(), 2) + Math.pow(Math.random(), 2) <= 1) {
      messageParent({ i }) 
      inside++;
    }
  }

  return (4 * inside) / points;
};
