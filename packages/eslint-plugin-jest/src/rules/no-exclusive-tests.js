// @flow
'use strict';

import type {EslintContext, EslintNode} from './types';

module.exports = function(context: EslintContext) {
  const jestTestFunctions = [
    'it',
    'describe',
    'test',
  ];

  function matchesTestFunction(object) {
    return object && jestTestFunctions.indexOf(object.name) !== -1;
  }

  function matchesExclusiveTestFunction(object) {
    return (
      object &&
      object.name.charAt(0) === 'f' &&
      jestTestFunctions.indexOf(object.name.substring(1)) !== -1
    );
  }

  function isPropertyNamedOnly(property) {
    return property && (property.name === 'only' || property.value === 'only');
  }

  function isCallToJestOnlyFunction(callee) {
    return callee.type === 'MemberExpression' && (
      matchesTestFunction(callee.object) && isPropertyNamedOnly(callee.property)
    );
  }

  function isCallToExclusiveJestFunction(callee) {
    return callee.type === 'Identifier' && (
      matchesExclusiveTestFunction(callee)
    );
  }

  return {
    CallExpression(node: EslintNode) {
      const callee = node.callee;
      if (!callee) {
        return;
      }

      if (isCallToJestOnlyFunction(callee)) {
        context.report({
          message: 'Unexpected exclusive test.',
          node: callee.property,
        });
        return;
      }

      if (isCallToExclusiveJestFunction(callee)) {
        context.report({
          message: 'Unexpected exclusive test.',
          node: callee,
        });
        return;
      }
    },
  };
};
