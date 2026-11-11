/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {PluginObj} from '@babel/core';
import type {NodePath} from '@babel/traverse';
import type {
  CallExpression,
  Expression,
  Identifier,
  ImportDeclaration,
  MemberExpression,
  Node,
  Statement,
  StringLiteral,
  Super,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types';

const JEST_GLOBAL_NAME = 'jest';
const JEST_GLOBALS_MODULE_NAME = '@jest/globals';
const JEST_GLOBALS_MODULE_JEST_EXPORT_NAME = 'jest';

const hoistedVariables = new WeakSet<VariableDeclarator>();
const hoistedJestGetters = new WeakSet<CallExpression>();
const hoistedJestExpressions = new WeakSet<Expression>();
// Variable bindings produced by `jest.hoisted(...)` declarators. Referencing
// them inside a `jest.mock` factory is always safe because the factory still
// runs after `jest.hoisted` has populated the binding at the top of the file.
const jestHoistedBindings = new WeakSet<VariableDeclarator>();

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
            } else if (jestHoistedBindings.has(node)) {
              // `jest.hoisted(...)` declarators run before any `jest.mock`
              // factory body, so referencing them is always safe.
              isAllowedIdentifier = true;
            }
          } else if (binding?.path.isImportSpecifier()) {
            const importDecl = binding.path
              .parentPath as NodePath<ImportDeclaration>;
            const imported = binding.path.get('imported');
            if (
              importDecl.node.source.value === JEST_GLOBALS_MODULE_NAME &&
              (imported.isIdentifier()
                ? imported.node.name
                : (imported.node as StringLiteral).value) ===
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

FUNCTIONS.hoisted = args => {
  if (args.length !== 1) {
    throw new TypeError(
      '`jest.hoisted` must be called with exactly one argument: an inline function.',
    );
  }
  const factory = args[0];
  if (!factory.isFunction()) {
    throw factory.buildCodeFrameError(
      'The argument of `jest.hoisted` must be an inline function.\n',
      TypeError,
    );
  }
  return true;
};

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
const isJestHoistedCall = (
  expr: NodePath<Node>,
): expr is NodePath<CallExpression> => {
  if (!expr.isCallExpression()) {
    return false;
  }
  const callee = expr.get<'callee'>('callee');
  if (!callee.isMemberExpression() || callee.node.computed) {
    return false;
  }
  const object = callee.get<'object'>('object');
  const property = callee.get<'property'>('property') as NodePath<Identifier>;
  return (
    property.isIdentifier() &&
    property.node.name === 'hoisted' &&
    isJestObject(object)
  );
};

const enforceHoistedAtTopLevel = (
  varDecl: NodePath<VariableDeclaration>,
  call: NodePath<CallExpression>,
) => {
  if (!varDecl.parentPath.isProgram()) {
    throw call.buildCodeFrameError(
      '`jest.hoisted` must be called at the top level of the file.\n',
      ReferenceError,
    );
  }
};

// Detects whether a call expression is `jest.mock(...)`.
const isJestMockCall = (
  expr: NodePath<Node>,
): expr is NodePath<CallExpression> => {
  if (!expr.isCallExpression()) {
    return false;
  }
  const callee = expr.get<'callee'>('callee');
  if (!callee.isMemberExpression() || callee.node.computed) {
    return false;
  }
  const object = callee.get<'object'>('object');
  const property = callee.get<'property'>('property') as NodePath<Identifier>;
  return (
    property.isIdentifier() &&
    property.node.name === 'mock' &&
    isJestObject(object)
  );
};

// `jest.hoisted` factory bodies run at the very top of the program. Calls to
// `jest.mock` or another `jest.hoisted` inside them would never observe the
// surrounding module state and produce confusing behaviour.
const enforceNoHoistAffectingCallsInFactory = (factory: NodePath) => {
  factory.traverse({
    CallExpression(callPath: NodePath<CallExpression>) {
      if (isJestMockCall(callPath) || isJestHoistedCall(callPath)) {
        const calleeName = isJestMockCall(callPath)
          ? 'jest.mock'
          : 'jest.hoisted';
        throw callPath.buildCodeFrameError(
          `\`${calleeName}\` cannot be called inside a \`jest.hoisted\` factory.\n`,
          ReferenceError,
        );
      }
    },
  });
};

// Rewrites `jest` references inside a `jest.hoisted` factory body to lazy
// `_getJestObj()` calls. The factory runs at the top of the program, before
// any `import {jest} from '@jest/globals'` has been initialised, so `jest`
// would otherwise be `undefined`.
const rewriteJestRefsInFactory = (
  factory: NodePath,
  declareGetter: () => Identifier,
  t: typeof import('@babel/types'),
) => {
  factory.traverse({
    Identifier(idPath: NodePath<Identifier>) {
      if (idPath.node.name !== JEST_GLOBAL_NAME) {
        return;
      }
      if (!idPath.isReferencedIdentifier()) {
        return;
      }
      if (!isJestObject(idPath)) {
        return;
      }
      idPath.replaceWith(t.callExpression(declareGetter(), []));
    },
  });
};

export default function jestHoist(
  babel: typeof import('@babel/core'),
): PluginObj<{
  declareJestObjGetterIdentifier: () => Identifier;
  jestObjGetterIdentifier?: Identifier;
}> {
  const {template, types: t} = babel;

  const createJestObjectGetter = template.statement`
    function GETTER_NAME() {
      const { JEST_GLOBALS_MODULE_JEST_EXPORT_NAME } = require("JEST_GLOBALS_MODULE_NAME");
      GETTER_NAME = () => JEST_GLOBALS_MODULE_JEST_EXPORT_NAME;
      return JEST_GLOBALS_MODULE_JEST_EXPORT_NAME;
    }
  `;

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
      Program: {
        enter(program) {
          // Pre-pass: register every top-level `jest.hoisted(...)` declarator
          // binding before any other visitor runs. This makes the bindings
          // visible to `jest.mock` factories that appear *earlier* in the
          // source than the declaration itself — without it, the
          // `VariableDeclaration` visitor would not have registered the
          // binding by the time `FUNCTIONS.mock` validates the factory body.
          for (const stmt of program.get('body')) {
            if (!stmt.isVariableDeclaration()) {
              continue;
            }
            for (const declarator of stmt.get('declarations')) {
              const init = declarator.get('init') as NodePath<Expression>;
              if (!init.node) {
                continue;
              }
              if (!isJestHoistedCall(init)) {
                continue;
              }
              jestHoistedBindings.add(declarator.node);
            }
          }
        },
      },
      ExpressionStatement(exprStmt) {
        // Check for `jest.hoisted` BEFORE `extractJestObjExprIfHoistable`
        // mutates the `jest` reference into `_getJestObj()`, which would
        // make `isJestHoistedCall` no longer match.
        const rawExpr = exprStmt.get('expression');
        const isBareHoisted = isJestHoistedCall(rawExpr);
        if (isBareHoisted && !exprStmt.parentPath.isProgram()) {
          throw rawExpr.buildCodeFrameError(
            '`jest.hoisted` must be called at the top level of the file.\n',
            ReferenceError,
          );
        }
        const jestObjInfo = extractJestObjExprIfHoistable(
          exprStmt.get('expression'),
        );
        if (jestObjInfo) {
          const jestCallExpr = t.callExpression(
            this.declareJestObjGetterIdentifier(),
            [],
          );
          jestObjInfo.path.replaceWith(jestCallExpr);
          if (jestObjInfo.hoist) {
            hoistedJestGetters.add(jestCallExpr);
          }
          // Bare `jest.hoisted(() => {...})` — rewrite `jest` references
          // inside the factory body for the same reason as the
          // `VariableDeclaration` path below.
          if (isBareHoisted) {
            const inner = exprStmt.get(
              'expression',
            ) as NodePath<CallExpression>;
            enforceNoHoistAffectingCallsInFactory(inner.get('arguments')[0]);
            rewriteJestRefsInFactory(
              inner.get('arguments')[0],
              this.declareJestObjGetterIdentifier.bind(this),
              t,
            );
          }
        }
      },
      VariableDeclaration(varDecl) {
        // Look for declarators initialized by `jest.hoisted(...)`. Each match
        // registers the binding so it can be referenced inside `jest.mock`
        // factories, and rewrites the jest-object expression to the lazy
        // `_getJestObj()` getter so the factory can run before the `jest`
        // import is initialised.
        let hoistsAnyDeclarator = false;
        for (const declarator of varDecl.get('declarations')) {
          const init = declarator.get('init') as NodePath<Expression>;
          if (!init.node) {
            continue;
          }
          const inner = init;
          if (!isJestHoistedCall(inner)) {
            continue;
          }
          // Validate argument shape via the FUNCTIONS entry (throws on bad
          // input — must run before we start mutating the tree).
          const args = inner.get('arguments');
          if (!FUNCTIONS.hoisted(args)) {
            continue;
          }
          enforceHoistedAtTopLevel(varDecl, inner);
          enforceNoHoistAffectingCallsInFactory(inner.get('arguments')[0]);
          jestHoistedBindings.add(declarator.node);
          hoistsAnyDeclarator = true;

          const callee = inner.get('callee') as NodePath<MemberExpression>;
          const jestObjExpr = callee.get('object');
          const jestCallExpr = t.callExpression(
            this.declareJestObjGetterIdentifier(),
            [],
          );
          jestObjExpr.replaceWith(jestCallExpr);

          rewriteJestRefsInFactory(
            inner.get('arguments')[0],
            this.declareJestObjGetterIdentifier.bind(this),
            t,
          );
        }
        if (hoistsAnyDeclarator && !varDecl.parentPath.isProgram()) {
          throw varDecl.buildCodeFrameError(
            '`jest.hoisted` declarations must be at the top level of the file.\n',
            ReferenceError,
          );
        }
      },
    },
    // in `post` to make sure we come after an import transform and can unshift above the `require`s
    post({path: program}) {
      type Item = {
        // User-authored hoisted statements: `jest.mock(...)` calls and
        // `jest.hoisted(...)` declarations, in source-traversal order. Side
        // effects of bare `jest.hoisted` factories must run in the same
        // relative order as `jest.mock` factories around them, so we keep
        // them in a single list instead of bucketing by kind.
        statements: Array<Statement>;
        // Synthesised pure-constant declarations lifted out of `jest.mock`
        // factory bodies. Always come first because they are dependencies of
        // the user-authored hoisted statements, not user-visible side effects.
        pureVars: Array<Statement>;
      };

      const stack: Array<Item> = [{pureVars: [], statements: []}];
      program.traverse({
        BlockStatement: {
          enter() {
            stack.push({pureVars: [], statements: []});
          },
          exit(path) {
            const item = stack.pop()!;
            path.node.body.unshift(...item.pureVars, ...item.statements);
          },
        },
        CallExpression(callExpr: NodePath<CallExpression>) {
          if (hoistedJestGetters.has(callExpr.node)) {
            const mockStmt = callExpr.getStatementParent();

            if (mockStmt?.parentPath.isBlock()) {
              stack.at(-1)!.statements.push(mockStmt.node);
              mockStmt.remove();
            }
          }
        },
        VariableDeclaration(varDecl: NodePath<VariableDeclaration>) {
          const isHoistedJestDecl = varDecl.node.declarations.some(declarator =>
            jestHoistedBindings.has(declarator),
          );
          if (!isHoistedJestDecl) {
            return;
          }
          // Move the entire declaration so `const`/`let`/`var` kind, multiple
          // declarators, and destructuring patterns survive verbatim.
          const declNode = varDecl.node;
          varDecl.remove();
          stack.at(-1)!.statements.push(declNode);
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
            stack
              .at(-1)!
              .pureVars.push(t.variableDeclaration(kind, [varDecl.node]));
          }
        },
      });
      const item = stack.pop()!;
      program.node.body.unshift(...item.pureVars, ...item.statements);
    },
  };
}
/* eslint-enable */
