/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import micromatch from 'micromatch';
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
  const globs: Array<string> = [];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );
});

it('works like micromatch with pure negated extglobs', () => {
  const globs = ['**/*.js', '!(some-module.test.js)'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('some-module.test.js')).toBe(
    micromatch(['some-module.test.js'], globs).length > 0,
  );
});

it('works like micromatch with negated extglobs', () => {
  const globs = ['**/*.js', '!(tests|coverage)/*.js'];
  const matcher = globsToMatcher(globs);

  expect(matcher('some-module.js')).toBe(
    micromatch(['some-module.js'], globs).length > 0,
  );

  expect(matcher('tests/some-module.test.js')).toBe(
    micromatch(['tests/some-module.test.js'], globs).length > 0,
  );
});

it('works like micromatch when options are passed after the same glob was used without them', () => {
  const globs = ['*.dotoption.js'];

  expect(globsToMatcher(globs)('.hidden.dotoption.js')).toBe(
    micromatch(['.hidden.dotoption.js'], globs, {dot: true}).length > 0,
  );

  expect(globsToMatcher(globs, {dot: false})('.hidden.dotoption.js')).toBe(
    micromatch(['.hidden.dotoption.js'], globs, {dot: false}).length > 0,
  );
});

it('works like micromatch when the same glob is used with different options', () => {
  const globs = ['*.caseoption.js'];

  expect(
    globsToMatcher(globs, {nocase: true})('SOME-MODULE.CASEOPTION.JS'),
  ).toBe(
    micromatch(['SOME-MODULE.CASEOPTION.JS'], globs, {nocase: true}).length > 0,
  );

  expect(
    globsToMatcher(globs, {nocase: false})('SOME-MODULE.CASEOPTION.JS'),
  ).toBe(
    micromatch(['SOME-MODULE.CASEOPTION.JS'], globs, {nocase: false}).length >
      0,
  );
});
