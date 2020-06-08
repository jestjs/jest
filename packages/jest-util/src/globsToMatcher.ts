/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import micromatch = require('micromatch');
import type {Config} from '@jest/types';
import replacePathSepForGlob from './replacePathSepForGlob';

const globsMatchers = new Map<
  string,
  {
    isMatch: (str: string) => boolean;
    negated: boolean;
  }
>();

export default function globsToMatcher(
  globs: Array<Config.Glob>,
): (path: Config.Path) => boolean {
  if (globs.length === 0) {
    return (_: Config.Path): boolean => false;
  }

  const matchers = globs.map(glob => {
    if (!globsMatchers.has(glob)) {
      const state = micromatch.scan(glob, {dot: true});
      const matcher = {
        isMatch: micromatch.matcher(glob, {dot: true}),
        negated: state.negated,
      };
      globsMatchers.set(glob, matcher);
    }
    return globsMatchers.get(glob)!;
  });

  return (path: Config.Path): boolean => {
    const replacedPath = replacePathSepForGlob(path);
    let kept = false;
    let omitted = false;
    let negatives = 0;

    for (let i = 0; i < matchers.length; i++) {
      const {isMatch, negated} = matchers[i];

      if (negated) negatives++;

      const matched = isMatch(replacedPath);

      if (!matched && negated) {
        kept = false;
        omitted = true;
      } else if (matched && !negated) {
        kept = true;
        omitted = false;
      }
    }

    return negatives === matchers.length ? !omitted : kept && !omitted;
  };
}
