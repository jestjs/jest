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

ruleTester.run('prefer_to_have_length', rules['prefer-to-have-length'], {
  valid: ['expect(files).toHaveLength(1);', "expect(files.name).toBe('file');"],

  invalid: [
    {
      code: 'expect(files.length).toBe(1);',
      errors: [
        {
          message: 'Use toHaveLength() instead',
          column: 22,
          line: 1,
        },
      ],
      output: 'expect(files).toHaveLength(1);',
    },
  ],
});
