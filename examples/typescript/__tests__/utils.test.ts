// Copyright (c) Meta Platforms, Inc. and affiliates.

import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import {isLocalhost} from '../utils';

let replacedEnv: jest.Replaced<typeof process.env> | undefined = undefined;

beforeEach(() => {
  replacedEnv = jest.replaceProperty(process, 'env', {});
});

afterEach(() => {
  replacedEnv?.restore();
});

it('isLocalhost should detect localhost environment', () => {
  replacedEnv.replaceValue({HOSTNAME: 'localhost'});

  expect(isLocalhost()).toBe(true);
});

it('isLocalhost should detect non-localhost environment', () => {
  expect(isLocalhost()).toBe(false);
});
