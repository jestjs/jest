/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// This plugin exists to make sure that we use a `Promise` that has not been messed with by user code.
// Might consider extending this to other globals as well in the future

const jestPromise = "(global['jest-promise-stay-away'] || global.Promise)";

module.exports = () => ({
  name: 'jest-native-promise',
  visitor: {
    MemberExpression(path) {
      if (path.node.object.name === 'Promise') {
        path.node.object.name = jestPromise;
      }
    },
    NewExpression(path) {
      if (path.node.callee.name === 'Promise') {
        path.node.callee.name = jestPromise;
      }
    },
  },
});
