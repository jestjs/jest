/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const mock = jest.fn();

afterEach(() => mock.mockReset());

test('empty with no calls mock', () => {
  expect(mock).toMatchSnapshot();
});

test('instantiated mock', () => {
  // eslint-disable-next-line no-new
  new mock({name: 'some fine name'});

  expect(mock).toMatchSnapshot();
});

test('mock with calls', () => {
  mock();
  mock({foo: 'bar'}, 42);

  expect(mock).toMatchSnapshot();
});

test('mock with name', () => {
  const mockWithName = jest.fn().mockName('name of mock is nice');

  expect(mockWithName).toMatchSnapshot();
});
