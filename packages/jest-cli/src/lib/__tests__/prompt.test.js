/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @emails oncall+jsinfra
*/
'use strict';

const Prompt = require('../prompt');
let {KEYS} = require('../../constants');

KEYS = Object.assign({}, KEYS, {
  E: '65',
  S: '73',
});

it('calls handler on change value', () => {
  const options = {max: 10, offset: -1};
  const prompt = new Prompt();
  const onChange = jest.fn();

  prompt.enter(onChange, jest.fn(), jest.fn());

  expect(onChange).toHaveBeenLastCalledWith('', options);

  prompt.put(KEYS.T);
  expect(onChange).toHaveBeenLastCalledWith('t', options);

  prompt.put(KEYS.E);
  expect(onChange).toHaveBeenLastCalledWith('te', options);

  prompt.put(KEYS.S);
  expect(onChange).toHaveBeenLastCalledWith('tes', options);

  prompt.put(KEYS.T);
  expect(onChange).toHaveBeenLastCalledWith('test', options);

  expect(onChange).toHaveBeenCalledTimes(5);
});

it('calls handler on success prompt', () => {
  const prompt = new Prompt();
  const onSuccess = jest.fn();

  prompt.enter(jest.fn(), onSuccess, jest.fn());

  prompt.put(KEYS.T);
  prompt.put(KEYS.E);
  prompt.put(KEYS.S);
  prompt.put(KEYS.T);
  prompt.put(KEYS.ENTER);

  expect(onSuccess).toHaveBeenCalledWith('test');
});

it('calls handler on cancel prompt', () => {
  const prompt = new Prompt();
  const onCancel = jest.fn();

  prompt.enter(jest.fn(), jest.fn(), onCancel);

  prompt.put(KEYS.T);
  prompt.put(KEYS.E);
  prompt.put(KEYS.S);
  prompt.put(KEYS.T);
  prompt.put(KEYS.ESCAPE);

  expect(onCancel).toHaveBeenCalled();
});
