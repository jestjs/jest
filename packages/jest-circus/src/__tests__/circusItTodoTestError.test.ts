/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

// Alias of `it` to avoid collision with global testing APIs.
let circusIt: Global.It;

const aliasCircusIt = () => {
  const {it} = require('../') as typeof import('../');
  circusIt = it;
};

aliasCircusIt();

describe('test/it.todo error throwing', () => {
  it('todo throws error when given no arguments', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      circusIt.todo();
    }).toThrow('Todo must be called with only a description.');
  });
  it('todo throws error when given more than one argument', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      circusIt.todo('test1', () => {});
    }).toThrow('Todo must be called with only a description.');
  });
  it('todo throws error when given none string description', () => {
    expect(() => {
      circusIt.todo(() => {});
    }).toThrow('Todo must be called with only a description.');
  });
});
