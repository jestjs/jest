/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import micromatch = require('micromatch');
import globsToMatcher from '../globsToMatcher';

it('works like micromatch with only positive globs', () => {
  const globs = ['**/*.test.js', '**/*.test.jsx'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );
});

it('works like micromatch with a mix of overlapping positive and negative globs', () => {
  const globs = ['**/*.js', '!**/*.test.js', '**/*.test.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );

  const globs2 = ['**/*.js', '!**/*.test.js', '**/*.test.js', '!**/*.test.js'];
  const matcher2 = globsToMatcher(globs2);

  expect(matcher2('some-module.js')).toBe(
    micromatch(['some-module.js'], globs2).length > 0,
  );

  expect(matcher2('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs2).length > 0,
  );
});

it('works like micromatch with only negative globs', () => {
  const globs = ['!**/*.test.js', '!**/*.test.jsx'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );
});

it('works like micromatch with empty globs', () => {
  const globs = [];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );
});
