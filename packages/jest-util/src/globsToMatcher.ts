/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import picomatch = require('picomatch');
import type {Config} from '@jest/types';
import replacePathSepForGlob from './replacePathSepForGlob';

type Matcher = (str: Config.Path) => boolean;

const globsToMatchersMap = new Map<
  string,
  {isMatch: Matcher; negated: boolean}
>();

const picomatchOptions = {dot: true};

/**
 * Converts a list of globs into a function that matches a path against the
 * globs.
 *
 * Every time picomatch is called, it will parse the glob strings and turn
 * them into regexp instances. Instead of calling picomatch repeatedly with
 * the same globs, we can use this function which will build the picomatch
 * matchers ahead of time and then have an optimized path for determining
 * whether an individual path matches.
 *
 * This function is based on the behavior of `micromatch()` version 3.
 * micromatch version 4 does respect order which does not make sense here, so
 * globs can appear in any order and will always yield the same result.
 *
 * @example
 * const isMatch = globsToMatcher(['*.js', '!*.test.js']);
 * isMatch('pizza.js'); // true
 * isMatch('pizza.test.js'); // false
 */
export default function globsToMatcher(globs: Array<Config.Glob>): Matcher {
  if (globs.length === 0) {
    // Since there were no globs given, we can simply have a fast path here and
    // return with a very simple function.
    return () => false;
  }

  const matchers = globs.map(glob => {
    if (!globsToMatchersMap.has(glob)) {
      const negated = glob.startsWith('!');
      const isMatch = picomatch(
        negated ? glob.slice(1) : glob,
        picomatchOptions,
      );

      const matcher = {
        isMatch,
        // Matchers that are negated have different behavior than matchers that
        // are not negated, so we need to store this information ahead of time.
        negated,
      };

      globsToMatchersMap.set(glob, matcher);
    }

    return globsToMatchersMap.get(glob)!;
  });

  return path => {
    const replacedPath = replacePathSepForGlob(path);
    let kept = undefined;
    let negatives = 0;

    for (let i = 0; i < matchers.length; i++) {
      const {isMatch, negated} = matchers[i];

      if (negated) {
        negatives++;
      } else if (kept !== undefined) {
        // The current pattern is not negated and we already have `kept` set to
        // either true or false, so we do not need to do anything, because if
        // kept===true we don't need to check if it matches anything more and if
        // kept===false the file is already ignored and we do not want to
        // overwrite that.
        continue;
      }

      const matched = isMatch(replacedPath);

      if (!matched) {
        continue;
      }

      // The path was matched, and if the matcher is a negated matcher, we
      // want to omit the path. If the matcher is not a negated matcher we
      // want to keep the path.
      kept = !negated;
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
