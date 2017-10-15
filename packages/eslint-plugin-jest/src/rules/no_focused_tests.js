/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EslintContext, CallExpression} from './types';

const testFunctions = Object.assign(Object.create(null), {
  describe: true,
  it: true,
  test: true,
});

const matchesTestFunction = object => object && testFunctions[object.name];

const isCallToFocusedTestFunction = object =>
  object && object.name[0] === 'f' && testFunctions[object.name.substring(1)];

const isPropertyNamedOnly = property =>
  property && (property.name === 'only' || property.value === 'only');

const isCallToTestOnlyFunction = callee =>
  matchesTestFunction(callee.object) && isPropertyNamedOnly(callee.property);

export default (context: EslintContext) => ({
  CallExpression(node: CallExpression) {
    const callee = node.callee;
    if (!callee) {
      return;
    }

    if (
      callee.type === 'MemberExpression' &&
      isCallToTestOnlyFunction(callee)
    ) {
      context.report({
        message: 'Unexpected focused test.',
        node: callee.property,
      });
      return;
    }

    if (callee.type === 'Identifier' && isCallToFocusedTestFunction(callee)) {
      context.report({
        message: 'Unexpected focused test.',
        node: callee,
      });
      return;
    }
  },
});
