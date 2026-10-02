/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {stripVTControlCharacters as stripAnsi} from 'util';
import {BufferedConsole} from '@jest/console';
import type {JestEnvironment} from '@jest/environment';
import type {Mock} from 'jest-mock';
import reportUnusedStubs from '../reportUnusedStubs';

const stub = (name: string): Mock =>
  ({getMockName: () => name}) as unknown as Mock;

const environmentWith = (unusedStubs: Array<Mock>): JestEnvironment =>
  ({
    moduleMocker: {getUnusedStubs: () => unusedStubs},
  }) as unknown as JestEnvironment;

describe('reportUnusedStubs', () => {
  let testConsole: BufferedConsole;

  const output = () =>
    stripAnsi(
      (testConsole.getBuffer() ?? []).map(log => log.message).join('\n'),
    );

  beforeEach(() => {
    testConsole = new BufferedConsole();
  });

  test('does not warn when no stub was left unused', () => {
    reportUnusedStubs(environmentWith([]), testConsole);

    expect(output()).toBe('');
  });

  test('warns with the name of the unused stub', () => {
    reportUnusedStubs(environmentWith([stub('multiply')]), testConsole);

    expect(output()).toContain(
      'Warning: 1 unused stub detected in this test file:',
    );
    expect(output()).toContain('  - multiply');
  });

  test('pluralizes the warning and lists every unused stub', () => {
    reportUnusedStubs(
      environmentWith([stub('multiply'), stub('add')]),
      testConsole,
    );

    expect(output()).toContain(
      'Warning: 2 unused stubs detected in this test file:',
    );
    expect(output()).toContain('  - multiply\n  - add');
  });

  test('does not warn without a module mocker', () => {
    reportUnusedStubs(
      {moduleMocker: null} as unknown as JestEnvironment,
      testConsole,
    );

    expect(output()).toBe('');
  });

  test('does not warn when the module mocker cannot report unused stubs', () => {
    reportUnusedStubs(
      {moduleMocker: {}} as unknown as JestEnvironment,
      testConsole,
    );

    expect(output()).toBe('');
  });
});
