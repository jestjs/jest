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

import type {EslintContext, CallExpression} from './types';

module.exports = function(context: EslintContext) {
  const jestTestFunctions = [
    'it',
    'describe',
    'test',
  ];

  function matchesTestFunction(object) {
    return object && jestTestFunctions.indexOf(object.name) !== -1;
  }

  function matchesSkippedTestFunction(object) {
    return (
      object &&
      object.name[0] === 'x' &&
      jestTestFunctions.indexOf(object.name.substring(1)) !== -1
    );
  }

  function isPropertyNamedSkip(property) {
    return property && (property.name === 'skip' || property.value === 'skip');
  }

  function isCallToJestSkipFunction(callee) {
    return (
      matchesTestFunction(callee.object) && isPropertyNamedSkip(callee.property)
    );
  }

  function isCallToSkippedJestFunction(callee) {
    return matchesSkippedTestFunction(callee);
  }

  return {
    CallExpression(node: CallExpression) {
      const callee = node.callee;
      if (!callee) {
        return;
      }

      if (
        callee.type === 'MemberExpression' &&
        isCallToJestSkipFunction(callee)
      ) {
        context.report({
          message: 'Unexpected skipped test.',
          node: callee.property,
        });
        return;
      }

      if (
        callee.type === 'Identifier' &&
        isCallToSkippedJestFunction(callee)
      ) {
        context.report({
          message: 'Unexpected skipped test.',
          node: callee,
        });
        return;
      }
    },
  };
};
