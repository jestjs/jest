/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import stripAnsi = require('strip-ansi');
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import diff from '../../diff';
import diffAndFormat from '../../index';
import {Kind} from '../../types';
import asymmetricMatcherPlugin from '../asymmetricMatcher';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

const strippedDiffAndFormat = (a, b) =>
  stripAnsi(
    diffAndFormat(a, b, {
      omitAnnotationLines: true,
      plugins: [asymmetricMatcherPlugin],
    }),
  );

const diffPlugin = {
  diff: asymmetricMatcherPlugin.diff,
  markChildrenRecursively: asymmetricMatcherPlugin.markChildrenRecursively,
  test: asymmetricMatcherPlugin.test,
};

describe('diff', () => {
  describe('expect.any()', () => {
    test('equal', () => {
      const a = 'a';
      const b = expect.any(String);

      const actual = diff(a, b, undefined, undefined, [diffPlugin]);
      expect(actual.kind).toBe(Kind.EQUAL);
    });
    test('updated', () => {
      const a = 123;
      const b = expect.any(String);

      const actual = diff(a, b, undefined, undefined, [diffPlugin]);
      expect(actual.kind).toBe(Kind.UNEQUAL_TYPE);
    });
  });
  test.todo('expect.objectContaining()');
});

describe('format', () => {
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

  test.todo('expect.objectContaining()');
});
