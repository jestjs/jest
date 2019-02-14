import {CustomDiff, CustomFormat} from '../types';
import {createEqual, createUpdated, isKindEqual} from '../diffObject';
import prettyFormat = require('pretty-format/src');
import {createCommonLine, formatUpdated} from '../line';

const asymmetricMatcher =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('jest.asymmetricMatcher')
    : 0x1357a5;

const test = (val: unknown): val is AsymmetricMatcher =>
  typeof val === 'object' &&
  val !== null &&
  (val as Record<string, unknown>).$$typeof === asymmetricMatcher;

interface AsymmetricMatcher {
  asymmetricMatch: (a: unknown) => boolean;
}

const diff: CustomDiff = (a, b, path) => {
  if (test(a)) {
    return a.asymmetricMatch(b)
      ? createEqual(a, b, path)
      : createUpdated(a, b, path);
  }

  return (b as AsymmetricMatcher).asymmetricMatch(a)
    ? createEqual(a, b, path)
    : createUpdated(a, b, path);
};

const format: CustomFormat = (diffObj, context) => {
  if (isKindEqual(diffObj.kind)) {
    const val = test(diffObj.a) ? diffObj.b : diffObj.a;
    return [createCommonLine(val, context)];
  }
  return formatUpdated(diffObj.a, diffObj.b, context);
};

export default {
  diff,
  format,
  serialize: prettyFormat.plugins.AsymmetricMatcher.serialize,
  test,
};
