/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const JEST_GLOBAL = {name: 'jest'};

const FUNCTIONS = {
  mock: {
    checkArgs: args => args.length === 1 && args[0].isStringLiteral(),
  },
  unmock: {
    checkArgs: args => args.length === 1 && args[0].isStringLiteral(),
  },
  disableAutomock: {
    checkArgs: args => args.length === 0,
  },
  enableAutomock: {
    checkArgs: args => args.length === 0,
  },
};

module.exports = babel => {
  const shouldHoistExpression = expr => {
    if (!expr.isCallExpression()) {
      return false;
    }

    const callee = expr.get('callee');
    const object = callee.get('object');
    const property = callee.get('property');
    return (
      property.isIdentifier() &&
      FUNCTIONS[property.node.name] &&
      FUNCTIONS[property.node.name].checkArgs(expr.get('arguments')) &&
      (
        object.isIdentifier(JEST_GLOBAL) ||
        (callee.isMemberExpression() && shouldHoistExpression(object))
      )
    );
  };
  return {
    visitor: {
      ExpressionStatement(path) {
        if (shouldHoistExpression(path.get('expression'))) {
          path.node._blockHoist = Infinity;
        }
      },
    },
  };
};
