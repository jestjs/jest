/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {PluginObj} from '@babel/core';
import {statement} from '@babel/template';
import type {NodePath} from '@babel/traverse';
import {
  type CallExpression,
  type Expression,
  type Identifier,
  type ImportDeclaration,
  type MemberExpression,
  type Node,
  type Statement,
  type Super,
  type VariableDeclaration,
  type VariableDeclarator,
  callExpression,
  isIdentifier,
  variableDeclaration,
} from '@babel/types';

const JEST_GLOBAL_NAME = 'jest';
const JEST_GLOBALS_MODULE_NAME = '@jest/globals';
const JEST_GLOBALS_MODULE_JEST_EXPORT_NAME = 'jest';

const hoistedVariables = new WeakSet<VariableDeclarator>();
const hoistedJestGetters = new WeakSet<CallExpression>();
const hoistedJestExpressions = new WeakSet<Expression>();

// We allow `jest`, `expect`, `require`, all default Node.js globals and all
// ES2015 built-ins to be used inside of a `jest.mock` factory.
// We also allow variables prefixed with `mock` as an escape-hatch.
const ALLOWED_IDENTIFIERS = new Set<string>(
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
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    'undefined',
    ...Object.getOwnPropertyNames(globalThis),
  ].sort(),
);

const IDVisitor = {
  ReferencedIdentifier(
    path: NodePath<Identifier>,
    {ids}: {ids: Set<NodePath<Identifier>>},
  ) {
    ids.add(path);
  },
  denylist: [
    'TypeAnnotation',
    'TSTypeAnnotation',
    'TSTypeQuery',
    'TSTypeReference',
  ],
};

const FUNCTIONS = Object.create(null) as Record<
  string,
  <T extends Node>(args: Array<NodePath<T>>) => boolean
>;

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

    const ids = new Set<NodePath<Identifier>>();
    const parentScope = moduleFactory.parentPath.scope;
    // @ts-expect-error: ReferencedIdentifier and denylist are not known on visitors
    moduleFactory.traverse(IDVisitor, {ids});
    for (const id of ids) {
      const {name} = id.node;
      let found = false;
      let scope = id.scope;

      while (scope !== parentScope) {
        if (scope.bindings[name] != null) {
          found = true;
          break;
        }

        scope = scope.parent;
      }

      if (!found) {
        let isAllowedIdentifier =
          (scope.hasGlobal(name) && ALLOWED_IDENTIFIERS.has(name)) ||
          /^mock/i.test(name) ||
          // Allow istanbul's coverage variable to pass.
          /^(?:__)?cov/.test(name);

        if (!isAllowedIdentifier) {
          const binding = scope.bindings[name];

          if (binding?.path.isVariableDeclarator()) {
            const {node} = binding.path;
            const initNode = node.init;

            if (initNode && binding.constant && scope.isPure(initNode, true)) {
              hoistedVariables.add(node);
              isAllowedIdentifier = true;
            }
          } else if (binding?.path.isImportSpecifier()) {
            const importDecl = binding.path
              .parentPath as NodePath<ImportDeclaration>;
            const imported = binding.path.node.imported;
            if (
              importDecl.node.source.value === JEST_GLOBALS_MODULE_NAME &&
              (isIdentifier(imported) ? imported.name : imported.value) ===
                JEST_GLOBALS_MODULE_JEST_EXPORT_NAME
            ) {
              isAllowedIdentifier = true;
              // Imports are already hoisted, so we don't need to add it
              // to hoistedVariables.
            }
          }
        }

        if (!isAllowedIdentifier) {
          throw id.buildCodeFrameError(
            'The module factory of `jest.mock()` is not allowed to ' +
              'reference any out-of-scope variables.\n' +
              `Invalid variable access: ${name}\n` +
              `Allowed objects: ${[...ALLOWED_IDENTIFIERS].join(', ')}.\n` +
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

const createJestObjectGetter = statement`
function GETTER_NAME() {
  const { JEST_GLOBALS_MODULE_JEST_EXPORT_NAME } = require("JEST_GLOBALS_MODULE_NAME");
  GETTER_NAME = () => JEST_GLOBALS_MODULE_JEST_EXPORT_NAME;
  return JEST_GLOBALS_MODULE_JEST_EXPORT_NAME;
}
`;

const isJestObject = (
  expression: NodePath<Expression | Super>,
): expression is NodePath<Identifier | MemberExpression> => {
  // global
  if (
    expression.isIdentifier() &&
    expression.node.name === JEST_GLOBAL_NAME &&
    !expression.scope.hasBinding(JEST_GLOBAL_NAME)
  ) {
    return true;
  }
  // import { jest } from '@jest/globals'
  if (
    expression.referencesImport(
      JEST_GLOBALS_MODULE_NAME,
      JEST_GLOBALS_MODULE_JEST_EXPORT_NAME,
    )
  ) {
    return true;
  }
  // import * as JestGlobals from '@jest/globals'
  if (
    expression.isMemberExpression() &&
    !expression.node.computed &&
    expression
      .get<'object'>('object')
      .referencesImport(JEST_GLOBALS_MODULE_NAME, '*') &&
    expression.node.property.type === 'Identifier' &&
    expression.node.property.name === JEST_GLOBALS_MODULE_JEST_EXPORT_NAME
  ) {
    return true;
  }

  return false;
};

type JestObjInfo = {
  hoist: boolean;
  path: NodePath<Expression>;
};

const extractJestObjExprIfHoistable = (expr: NodePath): JestObjInfo | null => {
  if (!expr.isCallExpression()) {
    return null;
  }

  const callee = expr.get<'callee'>('callee');
  const args = expr.get<'arguments'>('arguments');

  if (!callee.isMemberExpression() || callee.node.computed) {
    return null;
  }

  const object = callee.get<'object'>('object');
  const property = callee.get<'property'>('property') as NodePath<Identifier>;
  const propertyName = property.node.name;

  const jestObjExpr = isJestObject(object)
    ? object
    : // The Jest object could be returned from another call since the functions are all chainable.
      extractJestObjExprIfHoistable(object)?.path;
  if (!jestObjExpr) {
    return null;
  }

  // Important: Call the function check last
  // It might throw an error to display to the user,
  // which should only happen if we're already sure it's a call on the Jest object.
  const functionIsHoistable = FUNCTIONS[propertyName]?.(args) ?? false;
  let functionHasHoistableScope = functionIsHoistable;
  for (
    let path: NodePath<Node> | null = expr;
    path && !functionHasHoistableScope;
    path = path.parentPath
  ) {
    functionHasHoistableScope = hoistedJestExpressions.has(
      // @ts-expect-error: it's ok if path.node is not an Expression, .has will
      // just return false.
      path.node,
    );
  }

  if (functionHasHoistableScope) {
    hoistedJestExpressions.add(expr.node);
    return {
      hoist: functionIsHoistable,
      path: jestObjExpr,
    };
  }

  return null;
};

/* eslint-disable sort-keys */
export default function jestHoist(): PluginObj<{
  declareJestObjGetterIdentifier: () => Identifier;
  jestObjGetterIdentifier?: Identifier;
}> {
  return {
    pre({path: program}) {
      this.declareJestObjGetterIdentifier = () => {
        if (this.jestObjGetterIdentifier) {
          return this.jestObjGetterIdentifier;
        }

        this.jestObjGetterIdentifier =
          program.scope.generateUidIdentifier('getJestObj');

        program.unshiftContainer('body', [
          createJestObjectGetter({
            GETTER_NAME: this.jestObjGetterIdentifier.name,
            JEST_GLOBALS_MODULE_JEST_EXPORT_NAME,
            JEST_GLOBALS_MODULE_NAME,
          }),
        ]);

        return this.jestObjGetterIdentifier;
      };
    },
    visitor: {
      ExpressionStatement(exprStmt) {
        const jestObjInfo = extractJestObjExprIfHoistable(
          exprStmt.get('expression'),
        );
        if (jestObjInfo) {
          const jestCallExpr = callExpression(
            this.declareJestObjGetterIdentifier(),
            [],
          );
          jestObjInfo.path.replaceWith(jestCallExpr);
          if (jestObjInfo.hoist) {
            hoistedJestGetters.add(jestCallExpr);
          }
        }
      },
    },
    // in `post` to make sure we come after an import transform and can unshift above the `require`s
    post({path: program}) {
      type Item = {calls: Array<Statement>; vars: Array<Statement>};

      const stack: Array<Item> = [{calls: [], vars: []}];
      program.traverse({
        BlockStatement: {
          enter() {
            stack.push({calls: [], vars: []});
          },
          exit(path) {
            const item = stack.pop()!;
            path.node.body.unshift(...item.vars, ...item.calls);
          },
        },
        CallExpression(callExpr: NodePath<CallExpression>) {
          if (hoistedJestGetters.has(callExpr.node)) {
            const mockStmt = callExpr.getStatementParent();

            if (mockStmt && mockStmt.parentPath.isBlock()) {
              stack.at(-1)!.calls.push(mockStmt.node);
              mockStmt.remove();
            }
          }
        },
        VariableDeclarator(varDecl: NodePath<VariableDeclarator>) {
          if (hoistedVariables.has(varDecl.node)) {
            // should be assert function, but it's not. So let's cast below
            varDecl.parentPath.assertVariableDeclaration();

            const {kind, declarations} = varDecl.parent as VariableDeclaration;
            if (declarations.length === 1) {
              varDecl.parentPath.remove();
            } else {
              varDecl.remove();
            }
            stack.at(-1)!.vars.push(variableDeclaration(kind, [varDecl.node]));
          }
        },
      });
      const item = stack.pop()!;
      program.node.body.unshift(...item.vars, ...item.calls);
    },
  };
}
/* eslint-enable */
