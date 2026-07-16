/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

import {defineConfig} from '..';

describe('defineConfig', () => {
  it('should return the same config when object config is provided', () => {
    const config: Config.InitialOptions = {
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    };

    expect(defineConfig(config)).toStrictEqual({
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    });
  });

  it('should return the same config when callback returns config object is provided', () => {
    const config: Config.InitialOptions = {
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    };
    const configFn = defineConfig(() => config);

    expect(configFn()).toStrictEqual({
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    });
  });

  it('should return the same config when callback returns Promise config object is provided', async () => {
    const config: Config.InitialOptions = {
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    };
    const configFn = defineConfig(() => {
      return new Promise<Config.InitialOptions>(resolve => {
        setTimeout(() => {
          resolve(config);
        });
      });
    });

    await expect(configFn).resolves.toStrictEqual(config);
  });
});
