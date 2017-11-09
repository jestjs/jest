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
        node.parent.parent &&
        node.parent.parent.type === 'MemberExpression'
      ) {
        const parentProperty = node.parent.property;
        const propertyName = parentProperty.name;
        const parentProperty2 = node.parent.parent.property;
        const propertyName2 = parentProperty2.name;
        const argument = node.parent.parent.parent.arguments[0];

        // $FlowFixMe
        const propertyDot = context
          .getSourceCode()
          .getFirstTokenBetween(
            parentProperty,
            parentProperty2,
            token => token.value === '.',
          );
        if (
          (propertyName === 'not' &&
            propertyName2 === 'toBe' &&
            argument.value === undefined) ||
          (propertyName === 'not' && propertyName2 === 'toBeUndefined')
        ) {
          context.report({
            fix(fixer) {
              const fixes = [
                fixer.remove(parentProperty),
                fixer.remove(propertyDot),
                fixer.replaceText(parentProperty2, 'toBeDefined'),
              ];
              if (argument) {
                fixes.push(fixer.remove(argument));
              }
              return fixes;
            },
            message: 'Use toBeDefined() instead',
            node: parentProperty,
          });
        }
      }
    },
  };
};
