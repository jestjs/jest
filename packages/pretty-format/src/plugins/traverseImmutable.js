'use strict';

const reactPlugin = require('./ReactElement');
const prettyFormat = require('../');

const IMMUTABLE_NAMESPACE = 'Immutable.';

const traverseImmutable = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
) : string => {
  let result = IMMUTABLE_NAMESPACE;

  result += val.map((item: any) => {
    if (reactPlugin.test(item)) {
      return reactPlugin.print(item, print, indent, opts, colors);
    } else if (item instanceof Object) {
      return prettyFormat(item);
    } else {
      return item;
    }
  });

  return result;
};

module.exports = traverseImmutable;
