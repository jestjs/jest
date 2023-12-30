/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const toString = Object.prototype.toString;

const MULTIPLE_VALID_OPTIONS_SYMBOL = Symbol('JEST_MULTIPLE_VALID_OPTIONS');

function validationConditionSingle(
  option: unknown,
  validOption: unknown,
): boolean {
  return (
    option === null ||
    option === undefined ||
    (typeof option === 'function' && typeof validOption === 'function') ||
    toString.call(option) === toString.call(validOption)
  );
}

export function getValues<T = unknown>(validOption: T): Array<T> {
  if (
    Array.isArray(validOption) &&
    // @ts-expect-error: no index signature
    validOption[MULTIPLE_VALID_OPTIONS_SYMBOL]
  ) {
    return validOption;
  }
  return [validOption];
}

export function validationCondition(
  option: unknown,
  validOption: unknown,
): boolean {
  return getValues(validOption).some(e => validationConditionSingle(option, e));
}

export function multipleValidOptions<T extends Array<unknown>>(
  ...args: T
): T[number] {
  const options = [...args] as T;
  // @ts-expect-error: no index signature
  options[MULTIPLE_VALID_OPTIONS_SYMBOL] = true;

  return options;
}
