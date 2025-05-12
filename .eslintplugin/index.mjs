/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {builtinRules} from 'eslint/use-at-your-own-risk';
import typescriptEslint from 'typescript-eslint';

const rules = {
  'no-restricted-types-eventually':
    typescriptEslint.plugin.rules['no-restricted-types'],
  'prefer-rest-params-eventually': builtinRules.get('prefer-rest-params'),
  'prefer-spread-eventually': builtinRules.get('prefer-spread'),
};

export default {rules};
