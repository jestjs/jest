/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const deepObject = {
  notAnError: [{hello: true, tooDeep: {notVisible: true}}],
};

test('Promise thrown during test', () => {
  throw Promise.resolve(5);
});

test('Boolean thrown during test', () => {
  // eslint-disable-next-line no-throw-literal
  throw false;
});

test('undefined thrown during test', () => {
  // eslint-disable-next-line no-throw-literal
  throw undefined;
});

test('Object thrown during test', () => {
  throw deepObject;
});

test('Object with stack prop thrown during test', () => {
  // eslint-disable-next-line no-throw-literal
  throw {stack: 42};
});

test('Error during test', () => {
  // eslint-disable-next-line no-undef
  doesNotExist.alsoThisNot;
});

test('done(Error)', done => {
  done(new Error('this is an error'));
});

test('done(non-error)', done => {
  done(deepObject);
});

test('returned promise rejection', () => Promise.reject(deepObject));
