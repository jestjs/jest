/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+jsinfra
 */
'use strict';

test('resolve, but fail', () => {
  return expect(Promise.resolve({foo: 'bar'})).resolves.toEqual({baz: 'bar'});
});

test('reject, but fail', () => {
  return expect(Promise.reject({foo: 'bar'})).rejects.toEqual({baz: 'bar'});
});

test('expect reject', () => {
  return expect(Promise.resolve({foo: 'bar'})).rejects.toEqual({foo: 'bar'});
});

test('expect resolve', () => {
  return expect(Promise.reject({foo: 'bar'})).resolves.toEqual({foo: 'bar'});
});

test('timeout', done => {
  jest.setTimeout(5);

  setTimeout(done, 10);
});
