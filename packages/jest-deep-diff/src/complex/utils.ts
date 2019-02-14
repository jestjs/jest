// eslint-disable-next-line @typescript-eslint/ban-types
export const getConstructorName = (val: Object): string =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';
