/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {NodePath, Visitor} from '@babel/traverse';
import type {Identifier} from '@babel/types';

// We allow `jest`, `expect`, `require`, all default Node.js globals and all
// ES2015 built-ins to be used inside of a `jest.mock` factory.
// We also allow variables prefixed with `mock` as an escape-hatch.
const WHITELISTED_IDENTIFIERS = new Set<string>(
  [
    'Array',
    'ArrayBuffer',
    'Boolean',
    'BigInt',
    'DataView',
    'Date',
    'Error',
    'EvalError',
    'Float32Array',
    'Float64Array',
    'Function',
    'Generator',
    'GeneratorFunction',
    'Infinity',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'InternalError',
    'Intl',
    'JSON',
    'Map',
    'Math',
    'NaN',
    'Number',
    'Object',
    'Promise',
    'Proxy',
    'RangeError',
    'ReferenceError',
    'Reflect',
    'RegExp',
    'Set',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'WeakMap',
    'WeakSet',
    'arguments',
    'console',
    'expect',
    'isNaN',
    'jest',
    'parseFloat',
    'parseInt',
    'require',
    'undefined',
    ...Object.getOwnPropertyNames(global),
  ].sort(),
);

const JEST_GLOBAL = {name: 'jest'};
// TODO: Should be Visitor<{ids: Set<NodePath<Identifier>>}>, but `ReferencedIdentifier` doesn't exist
const IDVisitor = {
  ReferencedIdentifier(path: NodePath<Identifier>) {
    // @ts-ignore: passed as Visitor State
    this.ids.add(path);
  },
  blacklist: ['TypeAnnotation', 'TSTypeAnnotation', 'TSTypeReference'],
};

const FUNCTIONS: Record<
  string,
  (args: Array<NodePath>) => boolean
> = Object.create(null);

FUNCTIONS.mock = args => {
  if (args.length === 1) {
    return args[0].isStringLiteral() || args[0].isLiteral();
  } else if (args.length === 2 || args.length === 3) {
    const moduleFactory = args[1];

    if (!moduleFactory.isFunction()) {
      throw moduleFactory.buildCodeFrameError(
        'The second argument of `jest.mock` must be an inline function.\n',
        TypeError,
      );
    }

    const ids: Set<NodePath<Identifier>> = new Set();
    const parentScope = moduleFactory.parentPath.scope;
    // @ts-ignore: Same as above: ReferencedIdentifier doesn't exist
    moduleFactory.traverse(IDVisitor, {ids});
    for (const id of ids) {
      const {name} = id.node;
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
        const isAllowedIdentifier =
          (scope.hasGlobal(name) && WHITELISTED_IDENTIFIERS.has(name)) ||
          /^mock/i.test(name) ||
          // Allow istanbul's coverage variable to pass.
          /^(?:__)?cov/.test(name);

        if (!isAllowedIdentifier) {
          throw id.buildCodeFrameError(
            'The module factory of `jest.mock()` is not allowed to ' +
              'reference any out-of-scope variables.\n' +
              'Invalid variable access: ' +
              name +
              '\n' +
              'Whitelisted objects: ' +
              Array.from(WHITELISTED_IDENTIFIERS).join(', ') +
              '.\n' +
              'Note: This is a precaution to guard against uninitialized mock ' +
              'variables. If it is ensured that the mock is required lazily, ' +
              'variable names prefixed with `mock` (case insensitive) are permitted.\n',
            ReferenceError,
          );
        }
      }
    }

    return true;
  }
  return false;
};

FUNCTIONS.unmock = args => args.length === 1 && args[0].isStringLiteral();
FUNCTIONS.deepUnmock = args => args.length === 1 && args[0].isStringLiteral();
FUNCTIONS.disableAutomock = FUNCTIONS.enableAutomock = args =>
  args.length === 0;

export default (): {visitor: Visitor} => {
  const shouldHoistExpression = (expr: NodePath): boolean => {
    if (!expr.isCallExpression()) {
      return false;
    }

    // TODO: avoid type casts - the types can be arrays (is it possible to ignore that without casting?)
    const callee = expr.get('callee') as NodePath;
    const expressionArguments = expr.get('arguments');
    const object = callee.get('object') as NodePath;
    const property = callee.get('property') as NodePath;
    return (
      property.isIdentifier() &&
      FUNCTIONS[property.node.name] &&
      (object.isIdentifier(JEST_GLOBAL) ||
        (callee.isMemberExpression() && shouldHoistExpression(object))) &&
      FUNCTIONS[property.node.name](
        Array.isArray(expressionArguments)
          ? expressionArguments
          : [expressionArguments],
      )
    );
  };

  const visitor: Visitor = {
    ExpressionStatement(path) {
      if (shouldHoistExpression(path.get('expression') as NodePath)) {
        // @ts-ignore: private, magical property
        path.node._blockHoist = Infinity;
      }
    },
    ImportDeclaration(path) {
      if (path.node.source.value === '@jest/globals') {
        // @ts-ignore: private, magical property
        path.node._blockHoist = Infinity;
      }
    },
    VariableDeclaration(path) {
      const declarations = path.get('declarations');

      if (declarations.length === 1) {
        const declarationInit = declarations[0].get('init');

        if (declarationInit.isCallExpression()) {
          const callee = declarationInit.get('callee') as NodePath;
          const callArguments = declarationInit.get('arguments') as Array<
            NodePath
          >;

          if (
            callee.isIdentifier() &&
            callee.node.name === 'require' &&
            callArguments.length === 1
          ) {
            const [argument] = callArguments;

            if (
              argument.isStringLiteral() &&
              argument.node.value === '@jest/globals'
            ) {
              // @ts-ignore: private, magical property
              path.node._blockHoist = Infinity;
            }
          }
        }
      }
    },
  };

  return {visitor};
};
