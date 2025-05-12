/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

describe('test.failing', () => {
  describe('should pass when', () => {
    test.failing('snapshot matchers fails', () => {
      expect('0').toMatchSnapshot();
    });

    test.failing("snapshot doesn't exist", () => {
      expect('0').toMatchSnapshot();
    });

    test.failing('inline snapshot matchers fails', () => {
      expect('0').toMatchInlineSnapshot('0');
    });

    test.failing('at least one snapshot fails', () => {
      expect('1').toMatchSnapshot();
      expect('0').toMatchSnapshot();
    });
  });

  describe('should fail when', () => {
    test.each([
      ['snapshot', 'snapshot'],
      ['inline snapshot', 'inlineSnapshot'],
    ])('%s matchers pass', (_, fileName) => {
      const dir = path.resolve(__dirname, '../test-failing-snapshot-all-pass');
      const result = runJest(dir, [`./__tests__/${fileName}.test.js`]);
      expect(result.exitCode).toBe(1);
    });
  });

  it('doesnt update or remove snapshots', () => {
    const dir = path.resolve(__dirname, '../test-failing-snapshot');
    const result = runJest(dir, ['-u']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toMatch(/snapshots? (written|removed|obsolete)/);

    const snapshot = fs
      .readFileSync(
        path.resolve(dir, './__tests__/__snapshots__/snapshot.test.js.snap'),
      )
      .toString();
    expect(snapshot).toMatchSnapshot();

    const inlineSnapshot = fs
      .readFileSync(path.resolve(dir, './__tests__/inlineSnapshot.test.js'))
      .toString();
    expect(inlineSnapshot).toMatchSnapshot();
  });
});
