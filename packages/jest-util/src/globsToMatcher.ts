/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import picomatch = require('picomatch');
import replacePathSepForGlob from './replacePathSepForGlob';

type Matcher = (str: string) => boolean;

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
 * This function is intended to match the behavior of `micromatch()`.
 *
 * @example
 * const isMatch = globsToMatcher(['*.js', '!*.test.js']);
 * isMatch('pizza.js'); // true
 * isMatch('pizza.test.js'); // false
 */
export default function globsToMatcher(globs: Array<string>): Matcher {
  if (globs.length === 0) {
    // Since there were no globs given, we can simply have a fast path here and
    // return with a very simple function.
    return () => false;
  }

  const matchers = globs.map(glob => {
    if (!globsToMatchersMap.has(glob)) {
      const isMatch = picomatch(glob, picomatchOptions, true);

      const matcher = {
        isMatch,
        // Matchers that are negated have different behavior than matchers that
        // are not negated, so we need to store this information ahead of time.
        negated: isMatch.state.negated || !!isMatch.state.negatedExtglob,
      };

      globsToMatchersMap.set(glob, matcher);
    }

    return globsToMatchersMap.get(glob)!;
  });

  return path => {
    const replacedPath = replacePathSepForGlob(path);
    let kept = undefined;
    let negatives = 0;

    for (const matcher of matchers) {
      const {isMatch, negated} = matcher;

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
