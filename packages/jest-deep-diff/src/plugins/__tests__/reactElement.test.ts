import stripAnsi = require('strip-ansi');
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import diff from '../../diff';
import reactPlugin from '../reactElement';
import {Kind} from '../../types';
import diffAndFormat from '../../index';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

const strippedDiffAndFormat = (a, b) =>
  stripAnsi(
    diffAndFormat(a, b, {
      omitAnnotationLines: true,
      plugins: [reactPlugin],
    }),
  );

const elementSymbol = Symbol.for('react.element');

describe('diff object', () => {
  test('marks updated children', () => {
    const a = {
      $$typeof: elementSymbol,
      props: {
        children: 'Hello',
        className: 'fun',
      },
      type: 'div',
    };
    const b = {
      $$typeof: elementSymbol,
      props: {
        children: 'Goodbye',
        className: 'fun',
      },
      type: 'div',
    };

    const expected = {
      a,
      b,
      childDiffs: [
        {
          a: a.props.children,
          b: b.props.children,
          kind: Kind.UPDATED,
          path: 'children',
        },
        {
          a: a.props.className,
          b: b.props.className,
          kind: Kind.EQUAL,
          path: 'className',
        },
      ],
      kind: Kind.UPDATED,
    };

    const actual = diff(a, b, undefined, undefined, [
      {
        diff: reactPlugin.diff,
        test: reactPlugin.test,
      },
    ]);

    expect(actual).toEqual(expected);
  });
});

describe('format', () => {
  test('only react element', () => {
    const a = {
      $$typeof: elementSymbol,
      props: {
        children: 'Hello',
        className: 'fun',
      },
      type: 'div',
    };
    const b = {
      $$typeof: elementSymbol,
      props: {
        children: 'Goodbye',
        className: 'fun',
      },
      type: 'div',
    };

    const expected = [
      '  <div',
      '    className="fun"',
      '  >',
      '-   Hello',
      '+   Goodbye',
      '  </div>',
    ].join('\n');

    const actual = strippedDiffAndFormat(a, b);
    expect(actual).toEqual(expected);
  });

  test('react element as value of object property', () => {
    const a = {
      a: {
        $$typeof: elementSymbol,
        props: {
          children: 'Hello',
          className: 'fun',
        },
        type: 'div',
      },
    };
    const b = {
      a: {
        $$typeof: elementSymbol,
        props: {
          children: 'Hello',
          className: 'fun',
        },
        type: 'div',
      },
      b: 1,
    };

    const expected = [
      '  Object {',
      '    "a": <div',
      '      className="fun"',
      '    >',
      '      Hello',
      '    </div>,',
      '+   "b": 1,',
      '  }',
    ].join('\n');

    const actual = strippedDiffAndFormat(a, b);

    expect(actual).toEqual(expected);
  });
});
