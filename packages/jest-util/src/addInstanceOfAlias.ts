/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// using `Function` is on purpose - it's exactly what we want in this case
// eslint-disable-next-line @typescript-eslint/ban-types
type InstanceOfThing = Function;

export default function addInstanceOfAlias(
  target: InstanceOfThing,
  alias: InstanceOfThing,
): void {
  if (target === alias) {
    throw new Error(
      'Attempted to call addInstanceOfAlias with the same object for both ' +
        'the target and the alias. This will create an infinite loop in ' +
        'instanceof checks.',
    );
  }

  const originalHasInstance = target[Symbol.hasInstance];
  Object.defineProperty(target, Symbol.hasInstance, {
    configurable: true,
    value: function aliasedHasInstance(potentialInstance: unknown) {
      return (
        potentialInstance instanceof alias ||
        originalHasInstance.call(this, potentialInstance)
      );
    },
    writable: true,
  });
}
