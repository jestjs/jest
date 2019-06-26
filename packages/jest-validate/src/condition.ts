/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const toString = Object.prototype.toString;

const MULTIPLE_VALID_OPTIONS_SYMBOL = Symbol('JEST_MULTIPLE_VALID_OPTIONS');

function validationConditionSingle(option: any, validOption: any): boolean {
  return (
    option === null ||
    option === undefined ||
    (typeof option === 'function' && typeof validOption === 'function') ||
    toString.call(option) === toString.call(validOption)
  );
}

export function getValues(validOption: any) {
  if (
    Array.isArray(validOption) &&
    // @ts-ignore
    validOption[MULTIPLE_VALID_OPTIONS_SYMBOL]
  ) {
    return validOption;
  }
  return [validOption];
}

export function validationCondition(option: any, validOption: any): boolean {
  return getValues(validOption).some(e => validationConditionSingle(option, e));
}

// TODO: This should infer the types of its arguments, and return a union type of the types
// See https://github.com/Microsoft/TypeScript/issues/5453
export function multipleValidOptions(...args: Array<any>) {
  const options = [...args];
  // @ts-ignore
  options[MULTIPLE_VALID_OPTIONS_SYMBOL] = true;
  return options;
}
