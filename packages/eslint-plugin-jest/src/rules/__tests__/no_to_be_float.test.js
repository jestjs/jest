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

ruleTester.run('no_to_be_float', rules['no-to-be-float'], {
  valid: [
    'expect(0.3).toBeCloseTo(0.3);',
    'expect(1).toBe(1);',
    'expect(1).toEqual(1);',
  ],

  invalid: [
    {
      code: 'expect(0.3).toBe(0.3);',
      errors: [
        {
          message: 'Use toBeCloseTo() instead',
          column: 13,
          line: 1,
        },
      ],
      output: 'expect(0.3).toBeCloseTo(0.3);',
    },
    {
      code: 'expect(0.3).toEqual(0.3);',
      errors: [
        {
          message: 'Use toBeCloseTo() instead',
          column: 13,
          line: 1,
        },
      ],
      output: 'expect(0.3).toBeCloseTo(0.3);',
    },
  ],
});
