/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const isOverrideProxySymbol = Symbol('override-proxy');
const targetSymbol = Symbol('target');

export function createOverrideProxy<T extends object>(target: T): T {
  const shadow = Object.create(null);

  shadow[targetSymbol] = target;

  function wrapValue<T extends object>(obj: T, prop: keyof T) {
    const value = Reflect.get(target, prop);

    if (value && typeof value === 'object') {
      if (isOverrideProxySymbol in value) {
        return value;
      }

      const proxy = createOverrideProxy(value);

      Reflect.set(obj, prop, proxy);

      return proxy;
    }

    return value;
  }

  return new Proxy(shadow, {
    deleteProperty(obj, prop) {
      return delete obj[prop];
    },

    get(obj, prop) {
      if (Reflect.has(obj, prop)) {
        return Reflect.get(obj, prop);
      }

      return wrapValue(obj, prop);
    },

    getOwnPropertyDescriptor(obj, prop) {
      if (Reflect.has(obj, prop)) {
        return Reflect.getOwnPropertyDescriptor(obj, prop);
      }

      const originDescriptor = Reflect.getOwnPropertyDescriptor(target, prop);

      const newDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
      };

      let value = wrapValue(obj, prop);

      if (originDescriptor && 'get' in originDescriptor) {
        newDescriptor.get = () => value;
      }

      if (originDescriptor && 'set' in originDescriptor) {
        newDescriptor.set = newValue => {
          value = newValue;
        };
      }

      if (originDescriptor && 'value' in originDescriptor) {
        newDescriptor.writable = true;
        newDescriptor.value = value;
      }

      Object.defineProperty(obj, prop, newDescriptor);

      return newDescriptor;
    },

    getPrototypeOf() {
      return Reflect.getPrototypeOf(target);
    },

    has(obj, prop) {
      return (
        prop === isOverrideProxySymbol ||
        Reflect.has(obj, prop) ||
        Reflect.has(target, prop)
      );
    },

    set(obj, prop, value) {
      Reflect.set(obj, prop, value);
      return true;
    },
  });
}
