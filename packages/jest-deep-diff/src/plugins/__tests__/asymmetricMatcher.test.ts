import stripAnsi = require('strip-ansi');
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import diff from '../../diff';
import asymmetricMatcherPlugin from '../asymmetricMatcher';
import {Kind} from '../../types';
import diffAndFormat from '../../index';

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
      expect(actual.kind).toBe(Kind.UPDATED);
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
  });

  test.todo('expect.objectContaining()');
});
