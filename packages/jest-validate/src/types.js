export type ValidationOptions = {|
  condition: Function,
  deprecate: Function,
  error: Function,
  namespace: ?string,
  footer: ?string,
  unknown: Function,
|};
