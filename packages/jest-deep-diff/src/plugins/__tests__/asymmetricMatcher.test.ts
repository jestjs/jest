/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import stripAnsi = require('strip-ansi');
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import oldDiff from 'jest-diff';
import diffAndFormat from '../../index';
import asymmetricMatcherPlugin from '../asymmetricMatcher';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

const strippedDiffAndFormat = (a, b) =>
  stripAnsi(
    diffAndFormat(a, b, {
      omitAnnotationLines: true,
      plugins: [asymmetricMatcherPlugin],
    }),
  );

describe('expect.any()', () => {
  describe('shows value in common line, when value of object property passes asymmetricmatch', () => {
    test('updated', () => {
      const a = {
        a: 'a',
        b: 1,
      };
      const b = {
        a: expect.any(String),
      };

      const expected = [
        '  Object {',
        '    "a": "a",',
        '-   "b": 1,',
        '  }',
      ].join('\n');

      expect(strippedDiffAndFormat(a, b)).toBe(expected);
    });

    test('nested equal object', () => {
      const a = {
        a: {
          a: 'a',
        },
        b: 1,
      };
      const b = {
        a: {
          a: expect.any(String),
        },
      };

      const expected = [
        '  Object {',
        '    "a": Object {',
        '      "a": "a",',
        '    },',
        '-   "b": 1,',
        '  }',
      ].join('\n');

      expect(strippedDiffAndFormat(a, b)).toBe(expected);
    });
  });

  test('shows seriliazed AsymmetricMatcher when value of object property does not pass asymmetric match', () => {
    const a = {
      a: 1331321,
    };
    const b = {
      a: expect.any(String),
    };

    const expected = [
      '  Object {',
      '-   "a": 1331321,',
      '+   "a": Any<String>,',
      '  }',
    ].join('\n');

    expect(strippedDiffAndFormat(a, b)).toBe(expected);
  });

  test('formats deleted assymetric matcher', () => {
    const a = {b: expect.any(String)};

    const b = {a: {a: 1}};
    const expected = [
      '  Object {',
      '-   "b": Any<String>,',
      '+   "a": Object {',
      '+     "a": 1,',
      '+   },',
      '  }',
    ].join('\n');
    const actual = strippedDiffAndFormat(a, b);
    expect(actual).toBe(expected);
  });

  test('formats inserted assymetric matcher', () => {
    const a = {a: {a: 1}};
    const b = {b: expect.any(String)};

    const expected = [
      '  Object {',
      '-   "a": Object {',
      '-     "a": 1,',
      '-   },',
      '+   "b": Any<String>,',
      '  }',
    ].join('\n');
    const actual = strippedDiffAndFormat(a, b);
    expect(actual).toBe(expected);
  });

  test('formats updated with complex object', () => {
    const a = {a: expect.any(String)};

    const b = {a: {a: 1}};
    const expected = [
      '  Object {',
      '-   "a": Any<String>,',
      '+   "a": Object {',
      '+     "a": 1,',
      '+   },',
      '  }',
    ].join('\n');

    const actual = strippedDiffAndFormat(a, b);
    expect(actual).toBe(expected);
  });

  test('formats equal with complex object', () => {
    const a = {a: expect.any(Object), b: 1};

    const b = {a: {a: 1}};
    const expected = [
      '  Object {',
      '    "a": Object {',
      '      "a": 1,',
      '    },',
      '-   "b": 1,',
      '  }',
    ].join('\n');
    const actual = strippedDiffAndFormat(a, b);
    expect(actual).toBe(expected);
  });
});

describe('expect.objectContaining()', () => {
  test('diff only highlights keys that are in asymmetricMatcher', () => {
    const a = {payload: {a: 'a', b: 'b', c: 'c', d: 'd'}, type: 'whatever'};
    const b = {
      payload: expect.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    const result = [
      '  Object {',
      '    "payload": Object {',
      '-     "a": "a",',
      '+     "a": "x",',
      '      "b": "b",',
      '      "c": "c",',
      '      "d": "d",',
      '    },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');

    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });

  test('correctly swaps instered/deleted lines if argument order is flipped', () => {
    const a = {
      payload: expect.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };
    const b = {payload: {a: 'a', b: 'b', c: 'c', d: 'd'}, type: 'whatever'};

    const result = [
      '  Object {',
      '    "payload": Object {',
      '-     "a": "x",',
      '+     "a": "a",',
      '      "b": "b",',
      '      "c": "c",',
      '      "d": "d",',
      '    },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');

    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });

  test('shows inserted if key is missing', () => {
    const a = {payload: {b: 'b', c: 'c', d: 'd'}, type: 'whatever'};
    const b = {
      payload: expect.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    const result = [
      '  Object {',
      '    "payload": Object {',
      '      "b": "b",',
      '      "c": "c",',
      '      "d": "d",',
      '+     "a": "x",',
      '    },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');

    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });

  test.only('shows key is missing', () => {
    const a = {type: 'whatever'};
    const b = {
      payload: expect.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    const result = [
      '  Object {',
      '    "payload": Object {',
      '      "b": "b",',
      '      "c": "c",',
      '      "d": "d",',
      '+     "a": "x",',
      '    },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');

    console.log(strippedDiffAndFormat(a, b));

    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });

  test('shows unequal type other value is not object', () => {
    const a = {payload: 'string', type: 'whatever'};
    const b = {
      payload: expect.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    const result = [
      '  Object {',
      '-   "payload": "string",',
      '+   "payload": ObjectContaining {',
      '+     "a": "x",',
      '+     "b": Any<String>,',
      '+   },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');
    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });

  test('shows correct diff for passing inverse match', () => {
    const a = {payload: {a: 'a', b: 'b', c: 'c', d: 'd'}, type: 'whatever'};

    const b = {
      payload: expect.not.objectContaining({
        a: 'x',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    expect(a).toStrictEqual(b);
    expect(strippedDiffAndFormat(a, b)).toEqual(
      'Compared values have no visual difference.',
    );
  });

  test('shows correct diff for non-passing inverse match', () => {
    const a = {payload: {a: 'a', b: 'b', c: 'c', d: 'd'}, type: 'whatever'};

    const b = {
      payload: expect.not.objectContaining({
        a: 'a',
        b: expect.any(String),
      }),
      type: 'whatever',
    };

    const result = [
      '  Object {',
      '    "payload": Object {',
      '      "c": "c",',
      '      "d": "d",',
      '-     "a": "a",',
      '-     "b":  Any<String>,',
      '    },',
      '    "type": "whatever",',
      '  }',
    ].join('\n');

    expect(a).not.toStrictEqual(b);
    console.log(strippedDiffAndFormat(a, b));
    expect(strippedDiffAndFormat(a, b)).toEqual(result);
  });
});

// inverse hasKey  result
//   0        0       0
//   1        0       1
//   0        1       1
//   1        1       0
