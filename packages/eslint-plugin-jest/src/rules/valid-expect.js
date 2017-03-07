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

const matchers = require('jest-matchers/build/matchers');
const bundledMatchers = Object.keys(matchers);

module.exports = (context: EslintContext) => {
  const extraMatchers = context.options.length &&
    context.options[0].extraMatchers
    ? context.options[0].extraMatchers
    : [];
  const validMatchers = bundledMatchers.concat(extraMatchers);

  return {
    CallExpression(node: CallExpression) {
      if (node.callee.name === 'expect') {
        // checking "expect()" arguments
        if (node.arguments.length > 1) {
          const secondArguementStart = node.arguments[1].loc.start.column;
          const lastArguementEnd = node.arguments[
            node.arguments.length - 1
          ].loc.end.column;

          context.report({
            loc: {
              end: {
                column: lastArguementEnd,
                line: node.loc.start.line,
              },
              start: {
                column: secondArguementStart,
                line: node.loc.start.line,
              },
            },
            message: 'More than one argument was passed to expect().',
            node,
          });
        } else if (node.arguments.length === 0) {
          context.report({
            loc: {
              end: {
                column: node.loc.start.column + 7,
                line: node.loc.start.line,
              },
              start: {
                column: node.loc.start.column + 6,
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
          let propertyName = parentNode.property.name;
          let grandParentType = parentNode.parent.type;

          // a property is accessed, get the next node
          if (grandParentType === 'MemberExpression') {
            // only `not` is allowed
            if (propertyName !== 'not') {
              context.report({
                message: `"${propertyName}" is not a valid property of expect.`,
                node: parentNode.property,
              });
            }

            // this next one should be the matcher
            parentNode = node.parent.parent;
            propertyName = parentNode.property.name;
            grandParentType = parentNode.parent.type;
          }

          // an unknown matcher was called
          if (validMatchers.indexOf(propertyName) === -1) {
            context.report({
              message: `"${propertyName}" is not a known matcher.`,
              node: parentNode.property,
            });
          }

          // matcher was not called
          if (grandParentType === 'ExpressionStatement') {
            context.report({
              message: `"${propertyName}" was not called.`,
              node: parentNode.property,
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
          loc: {
            end: {
              column: node.parent.end,
            },
            start: {
              column: node.end,
            },
          },
          message: 'No assertion was called on expect().',
          node,
        });
      }
    },
  };
};
