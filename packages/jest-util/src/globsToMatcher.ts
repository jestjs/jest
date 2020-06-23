/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import micromatch = require('micromatch');
import type {Config} from '@jest/types';
import replacePathSepForGlob from './replacePathSepForGlob';

const globsToMatchersMap = new Map<
  string,
  {
    isMatch: (str: string) => boolean;
    negated: boolean;
  }
>();

const micromatchOptions = {dot: true};

/**
 * Converts a list of globs into a function that matches a path against the
 * globs.
 *
 * Every time micromatch is called, it will parse the glob strings and turn
 * them into regexp instances. Instead of calling micromatch repeatedly with
 * the same globs, we can use this function which will build the micromatch
 * matchers ahead of time and then have an optimized path for determining
 * whether an individual path matches.
 *
 * This function is intended to match the behavior of `micromatch()`.
 *
 * @example
 * const isMatch = globsToMatcher(['*.js', '!*.test.js']);
 * isMatch('pizza.js'); // true
 * isMatch('pizza.test.js'); // false
 */
export default function globsToMatcher(
  globs: Array<Config.Glob>,
): (path: Config.Path) => boolean {
  if (globs.length === 0) {
    // Since there were no globs given, we can simply have a fast path here and
    // return with a very simple function.
    return (_: Config.Path): boolean => false;
  }

  const matchers = globs.map(glob => {
    if (!globsToMatchersMap.has(glob)) {
      // Matchers that are negated have different behavior than matchers that
      // are not negated, so we need to store this information ahead of time.
      const {negated} = micromatch.scan(glob, micromatchOptions);

      const matcher = {
        isMatch: micromatch.matcher(glob, micromatchOptions),
        negated,
      };

      globsToMatchersMap.set(glob, matcher);
    }

    return globsToMatchersMap.get(glob)!;
  });

  return (path: Config.Path): boolean => {
    const replacedPath = replacePathSepForGlob(path);
    let kept = undefined;
    let negatives = 0;

    for (let i = 0; i < matchers.length; i++) {
      const {isMatch, negated} = matchers[i];

      if (negated) {
        negatives++;
      }

      const matched = isMatch(replacedPath);

      if (!matched && negated) {
        // The path was not matched, and the matcher is a negated matcher, so we
        // want to omit the path. This means that the negative matcher is
        // filtering the path out.
        kept = false;
      } else if (matched && !negated) {
        // The path was matched, and the matcher is not a negated matcher, so we
        // want to keep the path.
        kept = true;
      }
    }

    // If all of the globs were negative globs, then we want to include the path
    // as long as it was not explicitly not kept. Otherwise only include
    // the path if it was kept. This allows sets of globs that are all negated
    // to allow some paths to be matched, while sets of globs that are mixed
    // negated and non-negated to cause the negated matchers to only omit paths
    // and not keep them.
    return negatives === matchers.length ? kept !== false : !!kept;
  };
}
