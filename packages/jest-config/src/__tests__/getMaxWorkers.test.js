/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getMaxWorkers from '../getMaxWorkers';

jest.mock('os');

describe('getMaxWorkers', () => {
  beforeEach(() => {
    require('os').__setCpus({length: 4});
  });

  it('Returns 1 when runInBand', () => {
    const argv = {runInBand: true};
    expect(getMaxWorkers(argv)).toBe(1);
  });

  it('Returns 1 when the OS CPUs are not available', () => {
    require('os').__setCpus(undefined);
    expect(getMaxWorkers({})).toBe(1);
  });

  it('Returns the `maxWorkers` when specified', () => {
    const argv = {maxWorkers: 8};
    expect(getMaxWorkers(argv)).toBe(8);
  });

  it('Returns based on the number of cpus', () => {
    expect(getMaxWorkers({})).toBe(3);
    expect(getMaxWorkers({watch: true})).toBe(2);
  });
});
