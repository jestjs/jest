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
          context.report({
            message: 'More than one argument was passed to expect().',
            node,
          });
        } else if (node.arguments.length === 0) {
          context.report({
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
          let propertyName = node.parent.property.name;
          let grandParentType = node.parent.parent.type;

          // a property is accessed, get the next node
          if (grandParentType === 'MemberExpression') {
            // only `not` is allowed
            if (propertyName !== 'not') {
              context.report({
                message: `"${propertyName}" is not a valid property of expect.`,
                node,
              });
            }

            // this next one should be the matcher
            propertyName = node.parent.parent.property.name;
            grandParentType = node.parent.parent.parent.type;
          }

          // an unknown matcher was called
          if (validMatchers.indexOf(propertyName) === -1) {
            context.report({
              message: `"${propertyName}" is not a known matcher.`,
              node,
            });
          }

          // matcher was not called
          if (grandParentType === 'ExpressionStatement') {
            context.report({
              message: `"${propertyName}" was not called.`,
              node,
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
        context.report({message: 'No assertion was called on expect().', node});
      }
    },
  };
};
