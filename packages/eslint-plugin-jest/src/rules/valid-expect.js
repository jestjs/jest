/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

/*
 * This implementation is ported from from eslint-plugin-jasmine.
 * MIT license, Tom Vincent.
 */

import type {EslintContext, CallExpression} from './types';

const expectProperties = ['not', 'resolves', 'rejects'];

const expectFunctionsWithoutArgs = ['anything', 'hasAssertions'];
const expectFunctionsWithStringArgs = ['stringContaining'];
const expectFunctionsWithArrayArgs = ['arrayContaining'];
const expectFunctionsWithObjectArgs = [
  'extend',
  'objectContaining',
  'addSnapshotSerializer',
];
const expectFunctionsWithNumberArgs = ['assertions'];
const expectFunctionsWithRegExpArgs = ['stringMatching'];

const expectFunctionsWithArgs = ['any'].concat(
  expectFunctionsWithArrayArgs,
  expectFunctionsWithNumberArgs,
  expectFunctionsWithObjectArgs,
  expectFunctionsWithRegExpArgs,
  expectFunctionsWithStringArgs,
);

const expectFunctions = expectFunctionsWithArgs.concat(
  expectFunctionsWithoutArgs,
);

function checkExpectFunction(calleeName, node, context) {
  // checking "expect()" arguments
  if (node.arguments.length > 1) {
    const secondArgumentLocStart = node.arguments[1].loc.start;
    const lastArgumentLocEnd =
      node.arguments[node.arguments.length - 1].loc.end;

    context.report({
      loc: {
        end: {
          column: lastArgumentLocEnd.column - 1,
          line: lastArgumentLocEnd.line,
        },
        start: secondArgumentLocStart,
      },
      message: 'More than one argument was passed to expect().',
      node,
    });
  } else if (node.arguments.length === 0) {
    const expectLength = calleeName.length;
    context.report({
      loc: {
        end: {
          column: node.loc.start.column + expectLength + 1,
          line: node.loc.start.line,
        },
        start: {
          column: node.loc.start.column + expectLength,
          line: node.loc.start.line,
        },
      },
      message: 'No arguments were passed to expect().',
      node,
    });
  }

  // something was called on `expect()`
  if (
    node.parent &&
    node.parent.type === 'MemberExpression' &&
    node.parent.parent
  ) {
    let parentNode = node.parent;
    let parentProperty = parentNode.property;
    let propertyName = parentProperty.name;
    let grandParent = parentNode.parent;

    // a property is accessed, get the next node
    if (grandParent.type === 'MemberExpression') {
      // a modifier is used, just get the next one
      if (expectProperties.indexOf(propertyName) > -1) {
        grandParent = grandParent.parent;
      } else {
        // only a few properties are allowed
        context.report({
          // For some reason `endColumn` isn't set in tests if `loc` is
          // not added
          loc: parentProperty.loc,
          message: `"${propertyName}" is not a valid property of expect.`,
          node: parentProperty,
        });
      }

      // this next one should be the matcher
      parentNode = parentNode.parent;
      // $FlowFixMe
      parentProperty = parentNode.property;
      propertyName = parentProperty.name;
    }

    // matcher was not called
    if (grandParent.type === 'ExpressionStatement') {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is not
        // added
        loc: parentProperty.loc,
        message: `"${propertyName}" was not called.`,
        node: parentProperty,
      });
    }
  }
}

function checkExpectExpression(callee, node, context) {
  const {property} = callee;
  const propertyName = property.name;
  const argument = node.arguments[0];

  if (expectFunctions.indexOf(propertyName) < 0) {
    // only a few properties are allowed
    context.report({
      // For some reason `endColumn` isn't set in tests if `loc` is
      // not added
      loc: property.loc,
      message: `"${propertyName}" is not a valid property of expect.`,
      node: property,
    });

    return;
  }

  if (
    expectFunctionsWithArgs.indexOf(propertyName) >= 0 &&
    node.arguments.length === 0
  ) {
    // only a few properties are allowed
    context.report({
      // For some reason `endColumn` isn't set in tests if `loc` is
      // not added
      loc: property.loc,
      message: `"${propertyName}" must be called with arguments.`,
      node: property,
    });

    return;
  }

  if (node.arguments.length > 1) {
    const secondArgumentLocStart = node.arguments[1].loc.start;
    const lastArgumentLocEnd =
      node.arguments[node.arguments.length - 1].loc.end;

    context.report({
      loc: {
        end: {
          column: lastArgumentLocEnd.column - 1,
          line: lastArgumentLocEnd.line,
        },
        start: secondArgumentLocStart,
      },
      message: `More than one argument was passed to "${propertyName}".`,
      node,
    });

    return;
  }

  if (expectFunctionsWithoutArgs.indexOf(propertyName) >= 0) {
    if (node.arguments.length > 0) {
      // only a few properties are allowed
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `"${propertyName}" must not be called with arguments.`,
        node: argument,
      });
    }

    return;
  }

  let {type} = argument;

  if (argument.regex) {
    type = 'regexp';
  } else if (type === 'Literal') {
    type = typeof argument.value;
  }

  if (type === 'Identifier' || type === 'CallExpression') {
    // No way to typecheck an identifier or callexpression
    return;
  }

  if (expectFunctionsWithStringArgs.indexOf(propertyName) >= 0) {
    if (type !== 'string') {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `Argument to "${propertyName}" must be a string.`,
        node: argument,
      });
    }

    return;
  }

  if (expectFunctionsWithArrayArgs.indexOf(propertyName) >= 0) {
    if (type !== 'ArrayExpression') {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `Argument to "${propertyName}" must be an array.`,
        node: argument,
      });
    }

    return;
  }

  if (expectFunctionsWithObjectArgs.indexOf(propertyName) >= 0) {
    if (type !== 'ObjectExpression') {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `Argument to "${propertyName}" must be an object.`,
        node: argument,
      });
    }

    return;
  }

  if (expectFunctionsWithNumberArgs.indexOf(propertyName) >= 0) {
    if (type !== 'number') {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `Argument to "${propertyName}" must be a number.`,
        node: argument,
      });
    }

    return;
  }

  if (expectFunctionsWithRegExpArgs.indexOf(propertyName) >= 0) {
    if (
      type !== 'regexp' &&
      type !== 'string' &&
      // $FlowFixMe
      !(type === 'NewExpression' && argument.callee.name === 'RegExp')
    ) {
      context.report({
        // For some reason `endColumn` isn't set in tests if `loc` is
        // not added
        loc: argument.loc,
        message: `Argument to "${propertyName}" must be a regexp.`,
        node: argument,
      });
    }

    return;
  }
}

module.exports = (context: EslintContext) => {
  return {
    CallExpression(node: CallExpression) {
      const callee = node.callee;

      if (callee.name === 'expect') {
        checkExpectFunction(callee.name, node, context);
      }

      if (
        callee.type === 'MemberExpression' &&
        callee.object.name === 'expect'
      ) {
        checkExpectExpression(callee, node, context);
      }
    },

    // nothing called on "expect()"
    'CallExpression:exit'(node: CallExpression) {
      if (
        node.callee.name === 'expect' &&
        node.parent.type === 'ExpressionStatement'
      ) {
        context.report({
          // For some reason `endColumn` isn't set in tests if `loc` is not
          // added
          loc: node.loc,
          message: 'No assertion was called on expect().',
          node,
        });
      }
    },
  };
};
