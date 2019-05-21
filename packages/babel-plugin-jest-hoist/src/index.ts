/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Only used for types
// eslint-disable-next-line
import {NodePath, Visitor} from '@babel/traverse';
// eslint-disable-next-line
import {Identifier} from '@babel/types';

const invariant = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error('babel-plugin-jest-hoist: ' + message);
  }
};

// We allow `jest`, `expect`, `require`, all default Node.js globals and all
// ES2015 built-ins to be used inside of a `jest.mock` factory.
// We also allow variables prefixed with `mock` as an escape-hatch.
const WHITELISTED_IDENTIFIERS: Set<string> = new Set([
  'Array',
  'ArrayBuffer',
  'Boolean',
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
]);
Object.getOwnPropertyNames(global).forEach(name => {
  WHITELISTED_IDENTIFIERS.add(name);
});

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

FUNCTIONS.mock = (args: Array<NodePath>) => {
  if (args.length === 1) {
    return args[0].isStringLiteral() || args[0].isLiteral();
  } else if (args.length === 2 || args.length === 3) {
    const moduleFactory = args[1];
    invariant(
      moduleFactory.isFunction(),
      'The second argument of `jest.mock` must be an inline function.',
    );

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
        invariant(
          (scope.hasGlobal(name) && WHITELISTED_IDENTIFIERS.has(name)) ||
            /^mock/i.test(name) ||
            // Allow istanbul's coverage variable to pass.
            /^(?:__)?cov/.test(name),
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
            'variable names prefixed with `mock` (case insensitive) are permitted.',
        );
      }
    }

    return true;
  }
  return false;
};

FUNCTIONS.unmock = (args: Array<NodePath>) =>
  args.length === 1 && args[0].isStringLiteral();
FUNCTIONS.deepUnmock = (args: Array<NodePath>) =>
  args.length === 1 && args[0].isStringLiteral();
FUNCTIONS.disableAutomock = FUNCTIONS.enableAutomock = (
  args: Array<NodePath>,
) => args.length === 0;

export = () => {
  const shouldHoistExpression = (expr: NodePath): boolean => {
    if (!expr.isCallExpression()) {
      return false;
    }

    const callee = expr.get('callee');
    const expressionArguments = expr.get('arguments');
    // TODO: avoid type casts - the types can be arrays (is it possible to ignore that without casting?)
    const object = callee.get('object') as NodePath;
    const property = callee.get('property') as NodePath;
    return (
      property.isIdentifier() &&
      FUNCTIONS[property.node.name] &&
      (object.isIdentifier(JEST_GLOBAL) ||
        (callee.isMemberExpression() && shouldHoistExpression(object))) &&
      FUNCTIONS[property.node.name](expressionArguments)
    );
  };

  const visitor: Visitor = {
    ExpressionStatement(path) {
      if (shouldHoistExpression(path.get('expression'))) {
        // @ts-ignore: private, magical property
        path.node._blockHoist = Infinity;
      }
    },
  };

  return {visitor};
};
