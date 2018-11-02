/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// This plugin exists to make sure that we use a `Promise` that has not been messed with by user code.
// Might consider extending this to other globals as well in the future

module.exports = ({template}) => {
  const promiseDeclaration = template(`
    var Promise = global[Symbol.for('jest-native-promise')] || global.Promise;
  `);
  const nowDeclaration = template(`
    var jestNow = global[Symbol.for('jest-native-now')] || global.Date.now;
  `);

  return {
    name: 'jest-native-globals',
    visitor: {
      ReferencedIdentifier(path, state) {
        if (path.node.name === 'Promise' && !state.jestInjectedPromise) {
          state.jestInjectedPromise = true;
          path
            .findParent(p => p.isProgram())
            .unshiftContainer('body', promiseDeclaration());
        }
        if (
          path.node.name === 'Date' &&
          path.parent.property &&
          path.parent.property.name === 'now'
        ) {
          if (!state.jestInjectedNow) {
            state.jestInjectedNow = true;
            path
              .findParent(p => p.isProgram())
              .unshiftContainer('body', nowDeclaration());
          }

          path.parentPath.replaceWithSourceString('jestNow');
        }
      },
    },
  };
};
