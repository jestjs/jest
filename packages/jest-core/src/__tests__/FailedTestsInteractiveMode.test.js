/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import {specialChars} from 'jest-util';
import FailedTestsInteractiveMode from '../FailedTestsInteractiveMode';

const {ARROW} = specialChars;

describe('FailedTestsInteractiveMode', () => {
  describe('updateWithResults', () => {
    it('renders usage information when all failures resolved', () => {
      const mockWrite = jest.fn();

      new FailedTestsInteractiveMode({write: mockWrite}).updateWithResults({
        numFailedTests: 1,
        snapshot: {},
      });

      expect(mockWrite).toHaveBeenCalledWith(
        `${chalk.bold('Watch Usage')}\n${chalk.dim(
          `${ARROW}Press`,
        )} Enter ${chalk.dim('to return to watch mode.')}\n`,
      );
    });
  });

  it('is inactive at construction', () => {
    expect(new FailedTestsInteractiveMode().isActive()).toBeFalsy();
  });

  it('skips activation when no failed tests are present', () => {
    const plugin = new FailedTestsInteractiveMode();

    plugin.run([]);
    expect(plugin.isActive()).toBeFalsy();

    plugin.run([{}]);
    expect(plugin.isActive()).toBeTruthy();
  });
});
