/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @emails oncall+jsinfra
*/

import getMaxWorkers from '../get_max_workers';

jest.mock('os', () => ({
  cpus: () => ({length: 4}),
}));

describe('getMaxWorkers', () => {
  it('Returns 1 when runInBand', () => {
    const argv = {runInBand: true};
    expect(getMaxWorkers(argv)).toBe(1);
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
