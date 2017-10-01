/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('test lifecycle hooks', () => {
  const actions = [];
  function pushMessage(message) {
    return () => {
      actions.push(message);
    };
  }

  // Validate in an afterAll to prevent previous hooks from firing again.
  // Note that when operating correctly, this afterAll will be called last.
  afterAll(() => {
    const expected = [
      'runner beforeAll1',
      'runner beforeAll2',
      'runner beforeEach1',
      'runner beforeEach2',
      'beforeEach1',
      'beforeEach2',
      'outer it 1',
      'afterEach2',
      'afterEach1',
      'runner afterEach2',
      'runner afterEach1',
      'runner afterAll2',
      'runner afterAll1',
    ];

    expect(actions).toEqual(expected);
  });

  beforeAll(pushMessage('runner beforeAll1'));
  afterAll(pushMessage('runner afterAll1'));
  beforeAll(pushMessage('runner beforeAll2'));
  afterAll(pushMessage('runner afterAll2'));
  beforeEach(pushMessage('runner beforeEach1'));
  afterEach(pushMessage('runner afterEach1'));
  beforeEach(pushMessage('runner beforeEach2'));
  afterEach(pushMessage('runner afterEach2'));

  describe('Something', () => {
    beforeEach(pushMessage('beforeEach1'));
    afterEach(pushMessage('afterEach1'));
    beforeEach(pushMessage('beforeEach2'));
    afterEach(pushMessage('afterEach2'));
    it('does it 1', pushMessage('outer it 1'));
  });
});
