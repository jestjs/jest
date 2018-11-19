/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// See: https://github.com/facebook/jest/pull/5154
export default function convertDescriptorToString(
  descriptor: string | Function,
) {
  if (
    typeof descriptor === 'string' ||
    typeof descriptor === 'number' ||
    descriptor === undefined
  ) {
    return descriptor;
  }

  if (typeof descriptor !== 'function') {
    throw new Error('describe expects a class, function, number, or string.');
  }

  if (descriptor.name !== undefined) {
    return descriptor.name;
  }

  // Fallback for old browsers, pardon Flow
  const stringified = descriptor.toString();
  const typeDescriptorMatch = stringified.match(/class|function/);
  const indexOfNameSpace =
    // $FlowFixMe
    typeDescriptorMatch.index + typeDescriptorMatch[0].length;
  // $FlowFixMe
  const indexOfNameAfterSpace = stringified.search(/\(|\{/, indexOfNameSpace);
  const name = stringified.substring(indexOfNameSpace, indexOfNameAfterSpace);
  return name.trim();
}
