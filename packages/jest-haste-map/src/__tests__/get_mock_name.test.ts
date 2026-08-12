/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'node:path';
import getMockName, {getAdjacentModulePath} from '../getMockName';

describe('getMockName', () => {
  it('extracts mock name from file path', () => {
    expect(getMockName(path.join('a', '__mocks__', 'c.js'))).toBe('c');

    expect(getMockName(path.join('a', '__mocks__', 'c', 'd.js'))).toBe(
      path.join('c', 'd').replaceAll('\\', '/'),
    );
  });

  it('names the module a mock sits next to', () => {
    expect(
      getAdjacentModulePath(path.join('a', 'b', '__mocks__', 'index.js')),
    ).toBe(path.join('a', 'b', 'index.js'));

    expect(getAdjacentModulePath(path.join('__mocks__', 'index.js'))).toBe(
      'index.js',
    );
  });

  it('has no adjacent module when the mock is nested deeper', () => {
    expect(
      getAdjacentModulePath(path.join('a', '__mocks__', 'b', 'index.js')),
    ).toBeNull();

    expect(getAdjacentModulePath(path.join('a', 'b', 'index.js'))).toBeNull();
  });
});
