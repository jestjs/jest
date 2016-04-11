/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

function invariant(condition, message) {
  if (!condition) {
    throw new Error('babel-plugin-jest-hoist: ' + message);
  }
}

// We allow `jest`, `require`, all default Node.js globals and all ES2015
// built-ins to be used inside of a `jest.mock` factory.
const WHITELISTED_IDENTIFIERS = {
  jest: true,
  require: true,
  Infinity: true,
  NaN: true,
  undefined: true,
  Object: true,
  Function: true,
  Boolean: true,
  Symbol: true,
  Error: true,
  EvalError: true,
  InternalError: true,
  RangeError: true,
  ReferenceError: true,
  SyntaxError: true,
  TypeError: true,
  URIError: true,
  Number: true,
  Math: true,
  Date: true,
  String: true,
  RegExp: true,
  Array: true,
  Int8Array: true,
  Uint8Array: true,
  Uint8ClampedArray: true,
  Int16Array: true,
  Uint16Array: true,
  Int32Array: true,
  Uint32Array: true,
  Float32Array: true,
  Float64Array: true,
  Map: true,
  Set: true,
  WeakMap: true,
  WeakSet: true,
  ArrayBuffer: true,
  DataView: true,
  JSON: true,
  Promise: true,
  Generator: true,
  GeneratorFunction: true,
  Reflect: true,
  Proxy: true,
  Intl: true,
  arguments: true,
};
Object.keys(global).forEach(name => WHITELISTED_IDENTIFIERS[name] = true);

const JEST_GLOBAL = {name: 'jest'};
const IDVisitor = {
  ReferencedIdentifier(path) {
    this.ids.add(path);
  },
};

const FUNCTIONS = Object.create(null);
FUNCTIONS.mock = args => {
  if (args.length === 1) {
    return args[0].isStringLiteral();
  } else if (args.length === 2) {
    const moduleFactory = args[1];
    invariant(
      moduleFactory.isFunction(),
      'The second argument of `jest.mock` must be a function.'
    );

    const ids = new Set();
    const parentScope = moduleFactory.parentPath.scope;
    moduleFactory.traverse(IDVisitor, {ids});
    for (const id of ids) {
      const name = id.node.name;
      let found = false;
      let scope = id.scope;

      while (scope !== parentScope) {
        if (scope.bindings[name]) {
          found = true;
          break;
        }

        scope = scope.parent;
      }

      if (!found) {
        invariant(
          scope.hasGlobal(name) && WHITELISTED_IDENTIFIERS[name],
          'The second argument of `jest.mock()` is not allowed to ' +
          'reference any outside variables.\n' +
          'Invalid variable access: ' + name + '\n' +
          'Whitelisted objects: ' +
          Object.keys(WHITELISTED_IDENTIFIERS).join(', ') + '.'
        );
      }
    }

    return true;
  }
  return false;
};

FUNCTIONS.unmock = args => args.length === 1 && args[0].isStringLiteral();

FUNCTIONS.disableAutomock =
  FUNCTIONS.enableAutomock =
    args => args.length === 0;

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
      FUNCTIONS[property.node.name](expr.get('arguments')) &&
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
