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

ruleTester.run('prefer_to_be_undefined', rules['prefer-to-be-undefined'], {
  valid: ['expect(undefined).toBeUndefined();'],

  invalid: [
    {
      code: 'expect(undefined).toBe(undefined);',
      errors: [
        {
          message: 'Use toBeUndefined() instead',
          column: 19,
          line: 1,
        },
      ],
      output: 'expect(undefined).toBeUndefined();',
    },
  ],
});
