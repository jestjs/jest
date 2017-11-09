/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable sort-keys */

'use strict';

import {RuleTester} from 'eslint';
const {rules} = require('../../');

const ruleTester = new RuleTester();

ruleTester.run('prefer_to_be_defined', rules['prefer-to-be-defined'], {
  valid: ['expect(true).toBeDefined();'],

  invalid: [
    {
      code: 'expect(true).not.toBe(undefined);',
      errors: [
        {
          message: 'Use toBeDefined() instead',
          column: 14,
          line: 1,
        },
      ],
      output: 'expect(true).toBeDefined();',
    },
    {
      code: 'expect(true).not.toBeUndefined();',
      errors: [
        {
          message: 'Use toBeDefined() instead',
          column: 14,
          line: 1,
        },
      ],
      output: 'expect(true).toBeDefined();',
    },
  ],
});
