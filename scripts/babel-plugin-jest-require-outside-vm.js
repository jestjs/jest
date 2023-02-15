/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');

/*
Replace

requireOutside('package')

with

require(require.resolve('package', {
  [Symbol.for('jest-resolve-outside-vm-option')]: true,
}));
*/

const REQUIRE_OUTSIDE_FUNCTION_NAME = 'requireOutside';

module.exports = ({template, types: t}) => {
  const replacement = template(`
    require(require.resolve(IMPORT_PATH, {
      [(globalThis['jest-symbol-do-not-touch'] || globalThis.Symbol).for('jest-resolve-outside-vm-option')]: true,
    }));
  `);
  return {
    name: 'jest-require-outside-vm',
    visitor: {
      CallExpression(path) {
        const {callee, arguments: args} = path.node;
        if (
          t.isIdentifier(callee) &&
          callee.name === REQUIRE_OUTSIDE_FUNCTION_NAME &&
          !path.scope.hasBinding(REQUIRE_OUTSIDE_FUNCTION_NAME)
        ) {
          assert.strictEqual(
            args.length,
            1,
            'requireOutside must be called with exactly one argument',
          );
          const importPath = args[0];
          path.replaceWith(replacement({IMPORT_PATH: importPath}));
        }
      },
    },
  };
};
