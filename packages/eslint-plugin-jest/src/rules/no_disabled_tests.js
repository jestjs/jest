/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {EslintContext, CallExpression} from './types';

/* $FlowFixMe */
const testFunctions = Object.assign(Object.create(null), {
  describe: true,
  it: true,
  test: true,
});

const matchesTestFunction = object => object && testFunctions[object.name];

const isCallToSkippedTestFunction = object =>
  object && object.name[0] === 'x' && testFunctions[object.name.substring(1)];

const isPropertyNamedSkip = property =>
  property && (property.name === 'skip' || property.value === 'skip');

const isCallToTestSkipFunction = callee =>
  matchesTestFunction(callee.object) && isPropertyNamedSkip(callee.property);

module.exports = (context: EslintContext) => ({
  CallExpression(node: CallExpression) {
    const callee = node.callee;
    if (!callee) {
      return;
    }

    if (
      callee.type === 'MemberExpression' &&
      isCallToTestSkipFunction(callee)
    ) {
      context.report({
        message: 'Unexpected disabled test.',
        node: callee.property,
      });
      return;
    }

    if (callee.type === 'Identifier' && isCallToSkippedTestFunction(callee)) {
      context.report({
        message: 'Unexpected disabled test.',
        node: callee,
      });
      return;
    }
  },
});
