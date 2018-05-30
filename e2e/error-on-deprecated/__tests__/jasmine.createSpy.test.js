/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('jasmine.createSpy', () => {
  const mySpy = jasmine.createSpy();
  mySpy('hello?');
  expect(mySpy).toHaveBeenCalledWith('hello?');
});
