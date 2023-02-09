/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

exports.rules = {
  'ban-types-eventually': require('@typescript-eslint/eslint-plugin').rules[
    'ban-types'
  ],
  'prefer-rest-params-eventually':
    require('eslint/use-at-your-own-risk').builtinRules.get(
      'prefer-rest-params',
    ),
  'prefer-spread-eventually':
    require('eslint/use-at-your-own-risk').builtinRules.get('prefer-spread'),
};
