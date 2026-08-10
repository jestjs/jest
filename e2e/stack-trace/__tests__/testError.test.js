/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('error stack trace', () => {
  it('fails', () => {
    throw new Error('this is unexpected.');
  });

  it('fails strings', () => {
    // eslint-disable-next-line no-throw-literal
    throw 'this is a string.';
  });

  it('tests', () => {
    jest.unmock('this-module-does-not-exist');
  });
});
