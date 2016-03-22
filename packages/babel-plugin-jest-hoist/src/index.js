/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const JEST_GLOBAL = {name: 'jest'};

const idVisitor = {
  ReferencedIdentifier(path) {
    this.ids.add(path);
  },
};

const FUNCTIONS = {
  mock: {
    checkArgs: args => {
      if (args.length === 1) {
        return args[0].isStringLiteral();
      } else if (args.length === 2) {
        const ids = new Set();
        args[1].traverse(idVisitor, {ids});

        const outerScope = args[1].parentPath.scope;

        for (let id of ids) {
          let found = false;
          let scope = id.scope;

          while (scope !== outerScope) {
            if (scope.bindings[id.node.name]) {
              found = true;
              break;
            }

            scope = scope.parent;
          }

          if (!found) {
            throw new Error(
              'babel-plugin-jest-hoist: The second argument of `jest.mock()` ' +
              'is not allowed to reference any outside variables.'
            );
          }
        }

        return true;
      }
      return false;
    },
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
