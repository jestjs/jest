/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

describe('Correct beforeEach order', () => {
  it('ensures the correct order for beforeEach with legacyExecutionOrder flag', () => {
    const result = runJest('before-each-queue/with-legacy-execution-order');
    expect(result.stdout).toMatchSnapshot();
  });

  it('ensures the correct order for beforeEach without legacyExecutionOrder flag', () => {
    const result = runJest('before-each-queue/without-legacy-execution-order');
    expect(result.stdout).toMatchSnapshot();
  });
});
