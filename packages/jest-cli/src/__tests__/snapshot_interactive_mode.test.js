/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import {KEYS} from '../constants';
import SnapshotInteractiveMode from '../snapshot_interactive_mode';

jest.mock('../lib/terminal_utils', () => ({
  getTerminalWidth: () => 80,
  rightPad: () => {
    '';
  },
}));

jest.mock('ansi-escapes', () => ({
  clearScreen: '[MOCK - eraseDown]',
  cursorRestorePosition: '[MOCK - cursorRestorePosition]',
  cursorSavePosition: '[MOCK - cursorSavePosition]',
  cursorScrollDown: '[MOCK - cursorScrollDown]',
  cursorTo: (x, y) => `[MOCK - cursorTo(${x}, ${y})]`,
  cursorUp: () => '[MOCK - cursorUp]',
  eraseDown: '[MOCK - eraseDown]',
}));

jest.doMock('chalk', () =>
  Object.assign(new chalk.constructor({enabled: false}), {
    stripColor: str => str,
  }),
);

describe('SnapshotInteractiveMode', () => {
  let pipe;
  let instance;
  let mockCallback;
  beforeEach(() => {
    pipe = {write: jest.fn()};
    instance = new SnapshotInteractiveMode(pipe);
    mockCallback = jest.fn(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
  });

  test('is inactive at construction', () => {
    expect(instance.isActive()).toBeFalsy();
  });

  test('call to run process the first file', () => {
    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'second.js', title: 'test two'},
    ];
    instance.run(assertions, mockCallback);
    expect(instance.isActive()).toBeTruthy();
    expect(mockCallback).toBeCalledWith(assertions[0], false);
  });

  test('call to abort', () => {
    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'second.js', title: 'test two'},
    ];
    instance.run(assertions, mockCallback);
    expect(instance.isActive()).toBeTruthy();
    instance.abort();
    expect(instance.isActive()).toBeFalsy();
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).toBeCalledWith(null, false);
  });

  test('call to reset', () => {
    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'second.js', title: 'test two'},
    ];
    instance.run(assertions, mockCallback);
    expect(instance.isActive()).toBeTruthy();
    instance.restart();
    expect(instance.isActive()).toBeTruthy();
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).toBeCalledWith(assertions[0], false);
  });

  test('press Q or ESC triggers an abort', () => {
    instance.abort = jest.fn();
    instance.put(KEYS.Q);
    instance.put(KEYS.ESCAPE);
    expect(instance.abort).toHaveBeenCalledTimes(2);
  });

  test('press ENTER trigger a run', () => {
    const assertions = [{path: 'first.js', title: 'test one'}];
    instance.run(assertions, mockCallback);
    instance.put(KEYS.ENTER);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(assertions[0], false);
  });

  test('skip 1 test, then restart', () => {
    const assertions = [{path: 'first.js', title: 'test one'}];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.R);
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).nthCalledWith(2, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  test('skip 1 test, then quit', () => {
    const assertions = [{path: 'first.js', title: 'test one'}];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.Q);
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).nthCalledWith(2, null, false);
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('update 1 test, then finish and return', () => {
    const mockCallback = jest.fn();
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: false}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });

    const assertions = [{path: 'first.js', title: 'test one'}];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.U);
    expect(mockCallback).nthCalledWith(2, assertions[0], true);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();

    instance.put(KEYS.ENTER);
    expect(instance.isActive()).toBe(false);
    expect(mockCallback).nthCalledWith(3, null, false);
  });

  test('skip 2 tests, then finish and restart', () => {
    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'first.js', title: 'test two'},
    ];
    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).nthCalledWith(2, assertions[1], false);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.R);
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).nthCalledWith(3, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  test('update 2 tests, then finish and return', () => {
    const mockCallback = jest.fn();
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: false}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: false}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });

    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'first.js', title: 'test two'},
    ];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.U);
    expect(mockCallback).nthCalledWith(2, assertions[0], true);
    expect(mockCallback).nthCalledWith(3, assertions[1], false);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.U);
    expect(mockCallback).nthCalledWith(4, assertions[1], true);
    expect(mockCallback).toHaveBeenCalledTimes(4);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.ENTER);
    expect(instance.isActive()).toBe(false);
    expect(mockCallback).nthCalledWith(5, null, false);
    expect(mockCallback).toHaveBeenCalledTimes(5);
  });

  test('update 1 test, skip 1 test, then finish and restart', () => {
    const mockCallback = jest.fn();
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: false}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });

    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'first.js', title: 'test two'},
    ];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.U);
    expect(mockCallback).nthCalledWith(2, assertions[0], true);
    expect(mockCallback).nthCalledWith(3, assertions[1], false);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.R);
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).nthCalledWith(4, assertions[1], false);
    expect(mockCallback).toHaveBeenCalledTimes(4);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });

  test('skip 1 test, update 1 test, then finish and restart', () => {
    const mockCallback = jest.fn();
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: false}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });
    mockCallback.mockImplementationOnce(() => {
      instance.updateWithResults({snapshot: {failure: true}});
    });

    const assertions = [
      {path: 'first.js', title: 'test one'},
      {path: 'first.js', title: 'test two'},
    ];

    instance.run(assertions, mockCallback);
    expect(mockCallback).nthCalledWith(1, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.S);
    expect(mockCallback).nthCalledWith(2, assertions[1], false);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.U);
    expect(mockCallback).nthCalledWith(3, assertions[1], true);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
    pipe.write.mockClear();

    instance.put(KEYS.R);
    expect(instance.getSkippedNum()).toBe(0);
    expect(mockCallback).nthCalledWith(4, assertions[0], false);
    expect(mockCallback).toHaveBeenCalledTimes(4);
    expect(pipe.write.mock.calls.join('\n')).toMatchSnapshot();
  });
});
