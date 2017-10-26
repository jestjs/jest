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
        const argument = node.parent.parent.arguments[0];

        if (propertyName === 'toBe' && argument.value === undefined) {
          context.report({
            fix(fixer) {
              return [
                fixer.replaceText(parentProperty, 'toBeUndefined'),
                fixer.remove(argument),
              ];
            },
            message: 'Use toBeUndefined() instead',
            node: parentProperty,
          });
        }
      }
    },
  };
};
