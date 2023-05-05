/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import stripAnsi = require('strip-ansi');
import {makeProjectConfig} from '@jest/test-utils';
import printDisplayName from '../printDisplayName';
import trimAndFormatPath from '../trimAndFormatPath';
import wrapAnsiString from '../wrapAnsiString';

describe('wrapAnsiString()', () => {
  it('wraps a long string containing ansi chars', () => {
    const string =
      `abcde ${chalk.red.bold('red-bold')} 1234456` +
      `${chalk.dim('bcd')} ` +
      '123ttttttththththththththththththththththththththth' +
      `tetetetetettetetetetetetetete${chalk.underline.bold('stnhsnthsnth')}` +
      'ssot';
    expect(wrapAnsiString(string, 10)).toMatchSnapshot();
    expect(stripAnsi(wrapAnsiString(string, 10))).toMatchSnapshot();
  });

  it('returns the string unaltered if given a terminal width of zero', () => {
    const string = "This string shouldn't cause you any trouble";
    expect(wrapAnsiString(string, 0)).toMatchSnapshot();
    expect(stripAnsi(wrapAnsiString(string, 0))).toMatchSnapshot();
  });
});

describe('trimAndFormatPath()', () => {
  it('trims dirname', () => {
    const pad = 5;
    const basename = '1234.js';
    const dirname = '1234567890/1234567890';
    const columns = 25;
    const result = trimAndFormatPath(
      pad,
      makeProjectConfig({cwd: '', rootDir: ''}),
      path.join(dirname, basename),
      columns,
    );

    expect(result).toMatchSnapshot();
    expect(stripAnsi(result)).toHaveLength(20);
  });

  it('trims dirname (longer line width)', () => {
    const pad = 5;
    const basename = '1234.js';
    const dirname = '1234567890/1234567890';
    const columns = 30;
    const result = trimAndFormatPath(
      pad,
      makeProjectConfig({cwd: '', rootDir: ''}),
      path.join(dirname, basename),
      columns,
    );

    expect(result).toMatchSnapshot();
    expect(stripAnsi(result)).toHaveLength(25);
  });

  it('trims dirname and basename', () => {
    const pad = 5;
    const basename = '1234.js';
    const dirname = '1234567890/1234567890';
    const columns = 15;
    const result = trimAndFormatPath(
      pad,
      makeProjectConfig({cwd: '', rootDir: ''}),
      path.join(dirname, basename),
      columns,
    );

    expect(result).toMatchSnapshot();
    expect(stripAnsi(result)).toHaveLength(10);
  });

  it('does not trim anything', () => {
    const pad = 5;
    const basename = '1234.js';
    const dirname = '1234567890/1234567890';
    const columns = 50;
    const totalLength = basename.length + path.sep.length + dirname.length;
    const result = trimAndFormatPath(
      pad,
      makeProjectConfig({cwd: '', rootDir: ''}),
      path.join(dirname, basename),
      columns,
    );

    expect(result).toMatchSnapshot();
    expect(stripAnsi(result)).toHaveLength(totalLength);
  });

  test('split at the path.sep index', () => {
    const pad = 5;
    const basename = '1234.js';
    const dirname = '1234567890';
    const columns = 16;
    const result = trimAndFormatPath(
      pad,
      makeProjectConfig({cwd: '', rootDir: ''}),
      path.join(dirname, basename),
      columns,
    );

    expect(result).toMatchSnapshot();
    expect(stripAnsi(result)).toHaveLength(columns - pad);
  });
});

describe('printDisplayName', () => {
  it('should default displayName color to white when displayName is a string', () => {
    expect(
      printDisplayName(
        makeProjectConfig({
          displayName: {
            color: 'white',
            name: 'hello',
          },
        }),
      ),
    ).toMatchSnapshot();
  });

  it('should default displayName color to white when color is not a valid value', () => {
    expect(
      printDisplayName(
        makeProjectConfig({
          displayName: {
            color: 'rubbish' as any,
            name: 'hello',
          },
        }),
      ),
    ).toMatchSnapshot();
  });

  it('should correctly print the displayName when color and name are valid values', () => {
    expect(
      printDisplayName(
        makeProjectConfig({
          displayName: {
            color: 'green',
            name: 'hello',
          },
        }),
      ),
    ).toMatchSnapshot();
  });
});
