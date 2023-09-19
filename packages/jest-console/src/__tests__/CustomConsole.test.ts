/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Writable} from 'stream';
import chalk = require('chalk');
import CustomConsole from '../CustomConsole';

describe('CustomConsole', () => {
  let _console: CustomConsole;
  let _stdout: string;
  let _stderr: string;

  beforeEach(() => {
    _stdout = '';
    _stderr = '';

    const stdout = new Writable({
      write(chunk: string, _encoding, callback) {
        _stdout += chunk.toString();
        callback();
      },
    }) as NodeJS.WriteStream;

    const stderr = new Writable({
      write(chunk: string, _encoding, callback) {
        _stderr += chunk.toString();
        callback();
      },
    }) as NodeJS.WriteStream;

    _console = new CustomConsole(stdout, stderr);
  });

  describe('log', () => {
    test('should print to stdout', () => {
      _console.log('Hello world!');

      expect(_stdout).toBe('Hello world!\n');
    });
  });

  describe('error', () => {
    test('should print to stderr', () => {
      _console.error('Found some error!');

      expect(_stderr).toBe('Found some error!\n');
    });
  });

  describe('warn', () => {
    test('should print to stderr', () => {
      _console.warn('Found some warning!');

      expect(_stderr).toBe('Found some warning!\n');
    });
  });

  describe('assert', () => {
    test('do not log when the assertion is truthy', () => {
      _console.assert(true);

      expect(_stderr).toMatch('');
    });

    test('do not log when the assertion is truthy and there is a message', () => {
      _console.assert(true, 'ok');

      expect(_stderr).toMatch('');
    });

    test('log the assertion error when the assertion is falsy', () => {
      _console.assert(false);

      expect(_stderr).toMatch('AssertionError');
      expect(_stderr).toMatch(
        // The message may differ across Node versions
        /(false == true)|(The expression evaluated to a falsy value:)/,
      );
    });

    test('log the assertion error when the assertion is falsy with another message argument', () => {
      _console.assert(false, 'this should not happen');

      expect(_stderr).toMatch('AssertionError');
      expect(_stderr).toMatch('this should not happen');
    });
  });

  describe('count', () => {
    test('count using the default counter', () => {
      _console.count();
      _console.count();
      _console.count();

      expect(_stdout).toBe('default: 1\ndefault: 2\ndefault: 3\n');
    });

    test('count using the a labeled counter', () => {
      _console.count('custom');
      _console.count('custom');
      _console.count('custom');

      expect(_stdout).toBe('custom: 1\ncustom: 2\ncustom: 3\n');
    });

    test('countReset restarts default counter', () => {
      _console.count();
      _console.count();
      _console.countReset();
      _console.count();
      expect(_stdout).toBe('default: 1\ndefault: 2\ndefault: 1\n');
    });

    test('countReset restarts custom counter', () => {
      _console.count('custom');
      _console.count('custom');
      _console.countReset('custom');
      _console.count('custom');

      expect(_stdout).toBe('custom: 1\ncustom: 2\ncustom: 1\n');
    });
  });

  describe('group', () => {
    test('group without label', () => {
      _console.group();
      _console.log('hey');
      _console.group();
      _console.log('there');

      expect(_stdout).toBe('  hey\n    there\n');
    });

    test('group with label', () => {
      _console.group('first');
      _console.log('hey');
      _console.group('second');
      _console.log('there');

      expect(_stdout).toBe(`  ${chalk.bold('first')}
  hey
    ${chalk.bold('second')}
    there
`);
    });

    test('groupEnd remove the indentation of the current group', () => {
      _console.group();
      _console.log('hey');
      _console.groupEnd();
      _console.log('there');

      expect(_stdout).toBe('  hey\nthere\n');
    });

    test('groupEnd can not remove the indentation below the starting point', () => {
      _console.groupEnd();
      _console.groupEnd();
      _console.group();
      _console.log('hey');
      _console.groupEnd();
      _console.log('there');

      expect(_stdout).toBe('  hey\nthere\n');
    });
  });

  describe('time', () => {
    test('should return the time between time() and timeEnd() on default timer', () => {
      _console.time();
      _console.timeEnd();

      expect(_stdout).toMatch('default: ');
      expect(_stdout).toMatch('ms');
    });

    test('should return the time between time() and timeEnd() on custom timer', () => {
      _console.time('custom');
      _console.timeEnd('custom');

      expect(_stdout).toMatch('custom: ');
      expect(_stdout).toMatch('ms');
    });
  });

  describe('dir', () => {
    test('should print the deepest value', () => {
      const deepObject = {1: {2: {3: {4: {5: {6: 'value'}}}}}};
      _console.dir(deepObject, {depth: 6});

      expect(_stdout).toMatch('value');
      expect(_stdout).not.toMatch('depth');
    });
  });

  describe('timeLog', () => {
    test('should return the time between time() and timeEnd() on default timer', () => {
      _console.time();
      _console.timeLog();

      expect(_stdout).toMatch('default: ');
      expect(_stdout).toMatch('ms');
      _console.timeEnd();
    });

    test('should return the time between time() and timeEnd() on custom timer', () => {
      _console.time('custom');
      _console.timeLog('custom');

      expect(_stdout).toMatch('custom: ');
      expect(_stdout).toMatch('ms');
      _console.timeEnd('custom');
    });

    test('default timer with data', () => {
      _console.time();
      _console.timeLog(undefined, 'foo', 5);

      expect(_stdout).toMatch('default: ');
      expect(_stdout).toMatch('ms foo 5');
      _console.timeEnd();
    });

    test('custom timer with data', () => {
      _console.time('custom');
      _console.timeLog('custom', 'foo', 5);

      expect(_stdout).toMatch('custom: ');
      expect(_stdout).toMatch('ms foo 5');
      _console.timeEnd('custom');
    });
  });

  describe('console', () => {
    test('should be able to initialize console instance', () => {
      expect(_console.Console).toBeDefined();
    });
  });
});
