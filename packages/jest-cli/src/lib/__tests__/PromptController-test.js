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

const PromptController = require('../PromptController');
const {KEYS} = require('../../constants');

it('should calls handler on change value', () => {
  const promptController = new PromptController();
  const onChange = jest.fn();

  promptController.prompt(onChange, jest.fn(), jest.fn());

  expect(onChange).toHaveBeenLastCalledWith('');

  promptController.put('74');
  expect(onChange).toHaveBeenLastCalledWith('t');

  promptController.put('65');
  expect(onChange).toHaveBeenLastCalledWith('te');

  promptController.put('73');
  expect(onChange).toHaveBeenLastCalledWith('tes');

  promptController.put('74');
  expect(onChange).toHaveBeenLastCalledWith('test');

  expect(onChange).toHaveBeenCalledTimes(5);
});

it('should calls handler on success prompt', () => {
  const promptController = new PromptController();
  const onSuccess = jest.fn();

  promptController.prompt(jest.fn(), onSuccess, jest.fn());

  promptController.put('74');
  promptController.put('65');
  promptController.put('73');
  promptController.put('74');
  promptController.put(KEYS.ENTER);

  expect(onSuccess).toHaveBeenCalledWith('test');
});

it('should calls handler on cancel prompt', () => {
  const promptController = new PromptController();
  const onCancel = jest.fn();

  promptController.prompt(jest.fn(), jest.fn(), onCancel);

  promptController.put('74');
  promptController.put('65');
  promptController.put('73');
  promptController.put('74');
  promptController.put(KEYS.ESCAPE);

  expect(onCancel).toHaveBeenCalled();
});
