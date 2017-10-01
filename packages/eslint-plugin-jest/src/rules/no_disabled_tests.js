/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Node, EslintContext, CallExpression} from './types';

function getName(node: ?Node): ?string {
  function joinNames(a: ?string, b: ?string): ?string {
    return a && b ? a + '.' + b : null;
  }

  switch (node && node.type) {
    case 'Identifier':
      // $FlowFixMe: ignore duck-typed node property
      return node.name;
    case 'Literal':
      // $FlowFixMe: ignore duck-typed node property
      return node.value;
    case 'MemberExpression':
      // $FlowFixMe: ignore duck-typed node properties
      return joinNames(getName(node.object), getName(node.property));
  }

  return null;
}

export default (context: EslintContext) => {
  let suiteDepth = 0;
  let testDepth = 0;

  return {
    CallExpression: (node: CallExpression) => {
      const functionName = getName(node.callee);

      switch (functionName) {
        case 'describe':
          suiteDepth++;
          break;

        case 'describe.skip':
          context.report({message: 'Skipped test suite', node});
          break;

        case 'it':
        case 'test':
          testDepth++;
          if (node.arguments.length < 2) {
            context.report({
              message: 'Test is missing function argument',
              node,
            });
          }
          break;

        case 'it.skip':
        case 'test.skip':
          context.report({message: 'Skipped test', node});
          break;

        case 'pending':
          if (testDepth > 0) {
            context.report({
              message: 'Call to pending() within test',
              node,
            });
          } else if (suiteDepth > 0) {
            context.report({
              message: 'Call to pending() within test suite',
              node,
            });
          }
          break;

        case 'xdescribe':
          context.report({message: 'Disabled test suite', node});
          break;

        case 'xit':
        case 'xtest':
          context.report({message: 'Disabled test', node});
          break;
      }
    },

    'CallExpression:exit': (node: CallExpression) => {
      const functionName = getName(node.callee);

      switch (functionName) {
        case 'describe':
          suiteDepth--;
          break;

        case 'it':
        case 'test':
          testDepth--;
          break;
      }
    },
  };
};
