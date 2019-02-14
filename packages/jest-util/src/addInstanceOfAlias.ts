/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

export default function addInstanceOfAlias(target: Function, alias: Function) {
  if (typeof Symbol === 'undefined' || Symbol.hasInstance == null) {
    return;
  }
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
    value: function aliasedHasInstance(potentialInstance: any) {
      return (
        potentialInstance instanceof alias ||
        originalHasInstance.call(this, potentialInstance)
      );
    },
    writable: true,
  });
}
