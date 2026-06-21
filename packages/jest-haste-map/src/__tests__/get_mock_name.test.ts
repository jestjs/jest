/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'node:path';
import getMockName, {getMockCandidateModulePath} from '../getMockName';

describe('getMockName', () => {
  it('extracts mock name from file path', () => {
    expect(getMockName(path.join('a', '__mocks__', 'c.js'))).toBe('c');

    expect(getMockName(path.join('a', '__mocks__', 'c', 'd.js'))).toBe(
      path.join('c', 'd').replaceAll('\\', '/'),
    );
  });

  it('resolves the mocked module adjacent to the __mocks__ directory', () => {
    expect(
      getMockCandidateModulePath(path.join('a', 'b', '__mocks__', 'index.js')),
    ).toBe(path.join('a', 'b', 'index.js'));
  });
});
