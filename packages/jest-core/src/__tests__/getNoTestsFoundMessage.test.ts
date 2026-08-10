/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TestPathPatterns} from '@jest/pattern';
import {makeGlobalConfig} from '@jest/test-utils';
import type {Config} from '@jest/types';
import getNoTestsFoundMessage from '../getNoTestsFoundMessage';

jest.mock('jest-util', () => ({
  ...jest.requireActual<typeof import('jest-util')>('jest-util'),
  isInteractive: true,
}));

describe('getNoTestsFoundMessage', () => {
  function createGlobalConfig(options?: Partial<Config.GlobalConfig>) {
    return makeGlobalConfig({
      rootDir: '/root/dir',
      testPathPatterns: new TestPathPatterns(['/path/pattern']),
      ...options,
    });
  }

  test('returns correct message when monitoring only failures', () => {
    const config = createGlobalConfig({onlyFailures: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message when monitoring only changed', () => {
    const config = createGlobalConfig({onlyChanged: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message with verbose option', () => {
    const config = createGlobalConfig({verbose: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message without options', () => {
    const config = createGlobalConfig();
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message with passWithNoTests', () => {
    const config = createGlobalConfig({passWithNoTests: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message with findRelatedTests', () => {
    const config = createGlobalConfig({findRelatedTests: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
    expect(
      getNoTestsFoundMessage([], {...config, passWithNoTests: true}),
    ).toMatchSnapshot();
  });
});
