const isObject = (a: any) => a !== null && typeof a === 'object';

export const getObjectSubset = (
  object: any,
  subset: any,
  seenReferences: WeakMap<object, boolean> = new WeakMap(),
): any => {
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
  if (Array.isArray(object)) {
    if (Array.isArray(subset) && subset.length === object.length) {
      // The map method returns correct subclass of subset.
      return subset.map((sub: any, i: number) =>
        getObjectSubset(object[i], sub),
      );
    }
  } else if (object instanceof Date) {
    return object;
  } else if (isObject(object) && isObject(subset)) {
    const extra: any = {};
    const trimmed: any = {};
    seenReferences.set(object, trimmed);

    Object.keys(object).forEach(key => {
      if (hasPropertyInObject(subset, key)) {
        trimmed[key] = seenReferences.has(object[key])
          ? seenReferences.get(object[key])
          : getObjectSubset(object[key], subset[key], seenReferences);
      } else {
        extra[key] = object[key];
      }
    });

    if (Object.keys(trimmed).length > 0) {
      return {extra, trimmed};
    }
  }
  return object;
};

export const removeObjectSubset = (
  object: any,
  subset: any,
  seenReferences: WeakMap<object, boolean> = new WeakMap(),
): any => {
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
  if (Array.isArray(object)) {
    if (Array.isArray(subset) && subset.length === object.length) {
      // The map method returns correct subclass of subset.
      return subset.map((sub: any, i: number) =>
        getObjectSubset(object[i], sub),
      );
    }
  } else if (object instanceof Date) {
    return object;
  } else if (isObject(object) && isObject(subset)) {
    const trimmed: any = {};
    seenReferences.set(object, trimmed);

    Object.keys(object)
      .filter(key => !hasPropertyInObject(subset, key))
      .forEach(key => {
        trimmed[key] = seenReferences.has(object[key])
          ? seenReferences.get(object[key])
          : getObjectSubset(object[key], subset[key], seenReferences);
      });

    if (Object.keys(trimmed).length > 0) {
      return trimmed;
    }
  }
  return object;
};

const hasPropertyInObject = (object: object, key: string): boolean => {
  const shouldTerminate =
    !object || typeof object !== 'object' || object === Object.prototype;

  if (shouldTerminate) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(object, key) ||
    hasPropertyInObject(Object.getPrototypeOf(object), key)
  );
};
