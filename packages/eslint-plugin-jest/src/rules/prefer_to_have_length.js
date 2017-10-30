/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EslintContext, CallExpression} from './types';

export default (context: EslintContext) => {
  return {
    CallExpression(node: CallExpression) {
      const calleeName = node.callee.name;

      if (
        calleeName === 'expect' &&
        node.arguments.length == 1 &&
        node.parent &&
        node.parent.type === 'MemberExpression' &&
        node.parent.parent
      ) {
        const parentProperty = node.parent.property;
        const propertyName = parentProperty.name;
        const argumentObject = node.arguments[0].object;
        const argumentProperty = node.arguments[0].property;

        if (propertyName === 'toBe' && argumentProperty.name === 'length') {
          // $FlowFixMe
          const propertyDot = context
            .getSourceCode()
            .getFirstTokenBetween(
              argumentObject,
              argumentProperty,
              token => token.value === '.',
            );
          context.report({
            fix(fixer) {
              return [
                fixer.remove(propertyDot),
                fixer.remove(argumentProperty),
                fixer.replaceText(parentProperty, 'toHaveLength'),
              ];
            },
            message: 'Use toHaveLength() instead',
            node: parentProperty,
          });
        }
      }
    },
  };
};
