/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const JEST_GLOBAL = {name: 'jest'};
const UNMOCK_FN = {name: 'unmock'};

module.exports = babel => {
  const t = babel.types;
  const isUnmockCall = expr => {
    if (!expr.isCallExpression()) {
      return false;
    }

    const callee = expr.get('callee');
    const object = callee.get('object');
    return (
      callee.get('property').isIdentifier(UNMOCK_FN) &&
      (
        object.isIdentifier(JEST_GLOBAL) ||
        (callee.isMemberExpression() && isUnmockCall(object))
      ) &&
      expr.get('arguments').length === 1 &&
      t.isStringLiteral(expr.get('arguments')[0])
    );
  };
  return {
    visitor: {
      ExpressionStatement(path) {
        if (isUnmockCall(path.get('expression'))) {
          path.node._blockHoist = Infinity;
        }
      },
    },
  };
};
