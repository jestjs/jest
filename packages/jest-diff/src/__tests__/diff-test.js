/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const diff = require('../');
const stripAnsi = require('strip-ansi');

function received(a, b, options, replacement) {
  return stripAnsi(diff(a, b, options, replacement));
}

const snapshot = {snapshot: true};
const unexpanded = {expand: false};
const unexpandedSnap = Object.assign({}, unexpanded, snapshot);
const expanded = {expand: true};
const expandedSnap = Object.assign({}, expanded, snapshot);

const toJSON = function toJSON() {
  return 'apple';
};

describe('different types', () => {
  [
    [1, 'a', 'number', 'string'],
    [{}, 'a', 'object', 'string'],
    [[], 2, 'array', 'number'],
    [null, undefined, 'null', 'undefined'],
    [() => {}, 3, 'function', 'number'],
  ].forEach(values => {
    const a = values[0];
    const b = values[1];
    const typeA = values[2];
    const typeB = values[3];

    test(`'${a}' and '${b}'`, () => {
      expect(received(a, b)).toBe(
        '  Comparing two different types of values. ' +
          `Expected ${typeA} but received ${typeB}.`,
      );
    });
  });
});

describe('no visual difference', () => {
  [
    ['a', 'a'],
    [{}, {}],
    [[], []],
    [[1, 2], [1, 2]],
    [11, 11],
    [() => {}, () => {}],
    [null, null],
    [undefined, undefined],
    [{a: 1}, {a: 1}],
    [{a: {b: 5}}, {a: {b: 5}}],
  ].forEach(values => {
    test(`'${JSON.stringify(values[0])}' and '${JSON.stringify(values[1])}'`, () => {
      expect(received(values[0], values[1])).toBe(
        'Compared values have no visual difference.',
      );
    });
  });

  test('Map key order should be irrelevant', () => {
    const arg1 = new Map([[1, 'foo'], [2, 'bar']]);
    const arg2 = new Map([[2, 'bar'], [1, 'foo']]);

    expect(received(arg1, arg2)).toBe(
      'Compared values have no visual difference.',
    );
  });

  test('Set value order should be irrelevant', () => {
    const arg1 = new Set([1, 2]);
    const arg2 = new Set([2, 1]);

    expect(received(arg1, arg2)).toBe(
      'Compared values have no visual difference.',
    );
  });
});

test('oneline strings', () => {
  // oneline strings don't produce a diff currently.
  expect(received('ab', 'aa')).toBe(null);
});

test('falls back to not call toJSON if objects look identical', () => {
  const a = {line: 1, toJSON};
  const b = {line: 2, toJSON};
  expect(diff(a, b)).toMatchSnapshot();
});

test('prints a fallback message if two objects truly look identical', () => {
  const a = {line: 2, toJSON};
  const b = {line: 2, toJSON};
  expect(diff(a, b)).toMatchSnapshot();
});

// Some of the following assertions seem complex, but compare to alternatives:
// * toMatch instead of toMatchSnapshot:
//   * to avoid visual complexity of escaped quotes in expected string
//   * to omit Expected/Received heading which is an irrelevant detail
// * join lines of expected string instead of multiline string:
//   * to avoid ambiguity about indentation in diff lines

test('falls back to not call toJSON', () => {
  const a = {line: 2, toJSON};
  const b = {key: {line: 2}, toJSON};
  expect(diff(a, b)).toMatchSnapshot();
  const expected = [
    ' Object {',
    '-  "key": Object {',
    '     "line": 2,',
    '-  },',
    '   "toJSON": [Function toJSON],',
    ' }',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
  });
});

describe('multiline strings', () => {
  const a = `line 1
line 2
line 3
line 4`;
  const b = `line 1
line  2
line 3
line 4`;
  const expected = [
    ' line 1',
    '-line 2',
    '+line  2',
    ' line 3',
    ' line 4',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
  });
});

describe('objects', () => {
  const a = {a: {b: {c: 5}}};
  const b = {a: {b: {c: 6}}};
  const expected = [
    ' Object {',
    '   "a": Object {',
    '     "b": Object {',
    '-      "c": 5,',
    '+      "c": 6,',
    '     },',
    '   },',
    ' }',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
  });
});

test('numbers', () => {
  const result = diff(123, 234);
  expect(result).toBe(null);
});

test('booleans', () => {
  const result = diff(true, false);
  expect(result).toBe(null);
});

describe('multiline string non-snapshot', () => {
  // For example, CLI output
  // toBe or toEqual for a string isn’t enclosed in double quotes.
  const a = `
Options:
--help, -h  Show help                            [boolean]
--bail, -b  Exit the test suite immediately upon the first
            failing test.                        [boolean]
`;
  const b = `
Options:
  --help, -h  Show help                            [boolean]
  --bail, -b  Exit the test suite immediately upon the first
              failing test.                        [boolean]
`;
  const expected = [
    ' Options:',
    '---help, -h  Show help                            [boolean]',
    '---bail, -b  Exit the test suite immediately upon the first',
    '-            failing test.                        [boolean]',
    '+  --help, -h  Show help                            [boolean]',
    '+  --bail, -b  Exit the test suite immediately upon the first',
    '+              failing test.                        [boolean]',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
  });
});

describe('multiline string snapshot', () => {
  // For example, CLI output
  // A snapshot of a string is enclosed in double quotes.
  const a = `
"
Options:
--help, -h  Show help                            [boolean]
--bail, -b  Exit the test suite immediately upon the first
            failing test.                        [boolean]"
`;
  const b = `
"
Options:
  --help, -h  Show help                            [boolean]
  --bail, -b  Exit the test suite immediately upon the first
              failing test.                        [boolean]"
`;
  const expected = [
    ' "',
    ' Options:',
    '---help, -h  Show help                            [boolean]',
    '---bail, -b  Exit the test suite immediately upon the first',
    '-            failing test.                        [boolean]"',
    '+  --help, -h  Show help                            [boolean]',
    '+  --bail, -b  Exit the test suite immediately upon the first',
    '+              failing test.                        [boolean]"',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpandedSnap)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expandedSnap)).toMatch(expected);
  });
});

describe('React elements', () => {
  const a = {
    $$typeof: Symbol.for('react.element'),
    props: {
      children: 'Hello',
      className: 'fun',
    },
    type: 'div',
  };
  const b = {
    $$typeof: Symbol.for('react.element'),
    className: 'fun', // ignored by serializer
    props: {
      children: 'Goodbye',
    },
    type: 'div',
  };
  const expected = [
    '-<div',
    '-  className="fun"',
    '->',
    '-  Hello',
    '+<div>',
    '+  Goodbye',
    ' </div>',
  ].join('\n');

  test('unexpanded', () => {
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
  });
});

test('collapses big diffs to patch format', () => {
  const result = diff(
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]},
    unexpanded,
  );

  expect(result).toMatchSnapshot();
});

describe('does ignore indentation in JavaScript structures', () => {
  const a = {
    searching: '',
    sorting: {
      descending: false,
      fieldKey: 'what',
    },
  };
  const b = {
    searching: '',
    sorting: [
      {
        descending: false,
        fieldKey: 'what',
      },
    ],
  };
  const aSnap = [
    'Object {',
    '  "searching": "",',
    '  "sorting": Object {',
    '    "descending": false,',
    '    "fieldKey": "what",',
    '  },',
    '}',
  ].join('\n');
  const bSnap = [
    'Object {',
    '  "searching": "",',
    '  "sorting": Array [',
    '    Object {',
    '      "descending": false,',
    '      "fieldKey": "what",',
    '    },',
    '  ],',
    '}',
  ].join('\n');

  describe('from less to more', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are more indented.
    const expected = [
      ' Object {',
      '   "searching": "",',
      '-  "sorting": Object {',
      '+  "sorting": Array [',
      '+    Object {',
      '       "descending": false,',
      '       "fieldKey": "what",',
      '     },',
      '+  ],',
      ' }',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(a, b, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(a, b, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(aSnap, bSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aSnap, bSnap, expandedSnap)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are less indented.
    const expected = [
      ' Object {',
      '   "searching": "",',
      '-  "sorting": Array [',
      '-    Object {',
      '+  "sorting": Object {',
      '     "descending": false,',
      '     "fieldKey": "what",',
      '   },',
      '-  ],',
      ' }',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(b, a, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(b, a, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(bSnap, aSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(bSnap, aSnap, expandedSnap)).toMatch(expected);
    });
  });
});

describe('multiline string as property of JavaScript object', () => {
  // Unindented is safest in multiline strings:
  const aUn = {
    id: 'J',
    points: `0.5,0.460
0.25,0.875`,
  };
  const bUn = {
    id: 'J',
    points: `0.5,0.460
0.5,0.875
0.25,0.875`,
  };
  const aUnSnap = [
    'Object {',
    '  "id": "J",',
    '  "points": "0.5,0.460',
    '0.25,0.875",',
    '}',
  ].join('\n');
  const bUnSnap = [
    'Object {',
    '  "id": "J",',
    '  "points": "0.5,0.460',
    '0.5,0.875',
    '0.25,0.875",',
    '}',
  ].join('\n');

  // Indented is confusing, as this test demonstrates :(
  // What looks like one indent level under points is really two levels,
  // because the test itself is indented one level!
  const aIn = {
    id: 'J',
    points: `0.5,0.460
      0.25,0.875`,
  };
  const bIn = {
    id: 'J',
    points: `0.5,0.460
      0.5,0.875
      0.25,0.875`,
  };
  const aInSnap = [
    'Object {',
    '  "id": "J",',
    '  "points": "0.5,0.460',
    '      0.25,0.875",',
    '}',
  ].join('\n');
  const bInSnap = [
    'Object {',
    '  "id": "J",',
    '  "points": "0.5,0.460',
    '      0.5,0.875',
    '      0.25,0.875",',
    '}',
  ].join('\n');

  describe('unindented', () => {
    const expected = [
      ' Object {',
      '   "id": "J",',
      '   "points": "0.5,0.460',
      '+0.5,0.875',
      ' 0.25,0.875",',
      ' }',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(aUn, bUn, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(aUn, bUn, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(aUnSnap, bUnSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aUnSnap, bUnSnap, expandedSnap)).toMatch(expected);
    });
  });

  describe('indented', () => {
    const expected = [
      ' Object {',
      '   "id": "J",',
      '   "points": "0.5,0.460',
      '+      0.5,0.875',
      '       0.25,0.875",',
      ' }',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(aIn, bIn, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(aIn, bIn, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(aInSnap, bInSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aInSnap, bInSnap, expandedSnap)).toMatch(expected);
    });
  });

  describe('unindented to indented', () => {
    // Don’t ignore changes to indentation in a multiline string.
    const expected = [
      ' Object {',
      '   "id": "J",',
      '   "points": "0.5,0.460',
      '-0.25,0.875",',
      '+      0.5,0.875',
      '+      0.25,0.875",',
      ' }',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(aUn, bIn, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(aUn, bIn, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(aUnSnap, bInSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aUnSnap, bInSnap, expandedSnap)).toMatch(expected);
    });
  });
});

describe('does ignore indentation in React elements', () => {
  const leaf = {
    $$typeof: Symbol.for('react.element'),
    props: {
      children: ['text'],
    },
    type: 'span',
  };
  const a = {
    $$typeof: Symbol.for('react.element'),
    props: {
      children: [leaf],
    },
    type: 'span',
  };
  const b = {
    $$typeof: Symbol.for('react.element'),
    props: {
      children: [
        {
          $$typeof: Symbol.for('react.element'),
          props: {
            children: [leaf],
          },
          type: 'strong',
        },
      ],
    },
    type: 'span',
  };
  const aSnap = [
    '<span>',
    '  <span>',
    '    text',
    '  </span>',
    '</span>',
  ].join('\n');
  const bSnap = [
    '<span>',
    '  <strong>',
    '    <span>',
    '      text',
    '    </span>',
    '  </strong>',
    '</span>',
  ].join('\n');

  describe('from less to more', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are more indented.
    const expected = [
      ' <span>',
      '+  <strong>',
      '     <span>',
      '       text',
      '     </span>',
      '+  </strong>',
      ' </span>',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(a, b, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(a, b, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(aSnap, bSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aSnap, bSnap, expandedSnap)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are less indented.
    const expected = [
      ' <span>',
      '-  <strong>',
      '   <span>',
      '     text',
      '   </span>',
      '-  </strong>',
      ' </span>',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(b, a, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(b, a, expanded)).toMatch(expected);
    });

    test('unexpanded snapshot', () => {
      expect(received(bSnap, aSnap, unexpandedSnap)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(bSnap, aSnap, expandedSnap)).toMatch(expected);
    });
  });
});
