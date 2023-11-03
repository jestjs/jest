export function withoutCircularRefs(obj: unknown): unknown {
  const cache = new WeakSet();
  function copy(obj: unknown) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    if (cache.has(obj)) {
      return '[Circular]';
    }
    cache.add(obj);
    const copyObj: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copyObj[key] = copy((obj as any)[key]);
      }
    }
    return copyObj;
  }
  return copy(obj);
}
