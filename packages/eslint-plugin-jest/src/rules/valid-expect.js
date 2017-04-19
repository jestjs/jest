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

module.exports = (context: EslintContext) => {
  return {
    CallExpression(node: CallExpression) {
      const calleeName = node.callee.name;

      if (calleeName === 'expect') {
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
