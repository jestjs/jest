/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {mergeConfig} from '../';

describe('mergeConfig', () => {
  describe('object configurations', () => {
    it('should merge 2 config objects', () => {
      const config1: Config.InitialOptions = {
        collectCoverage: true,
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/src/$1',
        },
        roots: ['<rootDir>/src'],
        testEnvironment: 'node',
      };
      const config2: Config.InitialOptions = {
        moduleNameMapper: {
          '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        },
        roots: ['<rootDir>/tests'],
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
        testEnvironment: 'jsdom',
      };

      expect(mergeConfig(config1, config2)).toStrictEqual({
        collectCoverage: true,
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/src/$1',
          '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        },
        roots: ['<rootDir>/src', '<rootDir>/tests'],
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
        testEnvironment: 'jsdom',
      });
    });

    it('should handle nested object merging', () => {
      const config1: Config.InitialOptions = {
        coverageThreshold: {
          global: {
            branches: 80,
            functions: 80,
          },
        },
      };
      const config2: Config.InitialOptions = {
        coverageThreshold: {
          global: {
            lines: 90,
            statements: 90,
          },
        },
      };

      expect(mergeConfig(config1, config2)).toStrictEqual({
        coverageThreshold: {
          global: {
            branches: 80,
            functions: 80,
            lines: 90,
            statements: 90,
          },
        },
      });
    });
  });

  describe('with callback configurations', () => {
    it('should throw error when default config object is a callback', () => {
      expect(() =>
        mergeConfig(
          // @ts-expect-error test runtime validation
          () => ({
            collectCoverage: true,
          }),
          {testEnvironment: 'node'},
        ),
      ).toThrow(new TypeError('Cannot merge config in form of callback'));
    });

    it('should throw error when overriding config object is a callback', () => {
      expect(() =>
        mergeConfig(
          {testEnvironment: 'node'},
          // @ts-expect-error test runtime validation
          () => ({
            collectCoverage: true,
          }),
        ),
      ).toThrow(new TypeError('Cannot merge config in form of callback'));
    });
  });
});
