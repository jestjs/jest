/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

let circusIt: Global.It;

// using jest-jasmine2's 'it' to test jest-circus's 'it'. Had to differentiate
// the two with this alias.

const aliasCircusIt = () => {
  const {it} = require('../');
  circusIt = it;
};

aliasCircusIt();

describe('test/it.todo error throwing', () => {
  it('todo throws error when given no arguments', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      circusIt.todo();
    }).toThrowError('Todo must be called with only a description.');
  });
  it('todo throws error when given more than one argument', () => {
    expect(() => {
      circusIt.todo('test1', () => {});
    }).toThrowError('Todo must be called with only a description.');
  });
  it('todo throws error when given none string description', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      circusIt.todo(() => {});
    }).toThrowError('Todo must be called with only a description.');
  });
});
