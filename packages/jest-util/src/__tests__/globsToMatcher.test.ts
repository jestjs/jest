/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import globsToMatcher from '../globsToMatcher';

it('works with only positive globs', () => {
  const globs = ['**/*.test.js', '**/*.test.jsx'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(false);
  expect(matcher('some-module.test.js')).toBe(true);
});

it('works with a mix of overlapping positive and negative globs', () => {
  const globs = ['**/*.js', '!**/*.test.js', '**/*.test.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('some-module.test.js')).toBe(false);

  const globs2 = ['**/*.js', '!**/*.test.js', '**/*.test.js', '!**/*.test.js'];
  const matcher2 = globsToMatcher(globs2);

  expect(matcher2('some-module.js')).toBe(true);
  expect(matcher2('some-module.test.js')).toBe(false);
});

it('works with only negative globs', () => {
  const globs = ['!**/*.test.js', '!**/*.test.jsx'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('some-module.test.js')).toBe(false);
});

it('works with empty globs', () => {
  const globs = [];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(false);
  expect(matcher('some-module.test.js')).toBe(false);
});

it('works with pure negated extglobs', () => {
  const globs = ['**/*.js', '!(some-module.test.js)'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('some-module.test.js')).toBe(false);
});

it('works with negated extglobs', () => {
  const globs = ['**/*.js', '!(tests|coverage)/*.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('tests/some-module.test.js')).toBe(false);
});

it('works with negated extglobs in reverse order', () => {
  const globs = ['!(tests|coverage)/*.js', '**/*.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('tests/some-module.test.js')).toBe(false);
});

it('works with negated glob in reverse order', () => {
  const globs = ['!tests/*.js', '**/*.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(true);
  expect(matcher('tests/some-module.test.js')).toBe(false);
});
