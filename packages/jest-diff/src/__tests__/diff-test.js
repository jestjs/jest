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

// diff has no space between mark and content when {expand: false}
// which is the default for Jest CLI but not for jest-diff
const optFalse = {expand: false};
const unexpanded = lines =>
  lines.map(line => line[0] + line.slice(2)).join('\n');

// diff has a space between mark and content when {expand: true}
// which requires --expand object for Jest CLI but is default for jest-diff
const optTrue = {expand: true};
const expanded = lines => lines.join('\n');

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
      expect(stripAnsi(diff(a, b))).toBe(
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
      expect(stripAnsi(diff(values[0], values[1]))).toBe(
        'Compared values have no visual difference.',
      );
    });
  });

  test('Map key order should be irrelevant', () => {
    const arg1 = new Map([[1, 'foo'], [2, 'bar']]);
    const arg2 = new Map([[2, 'bar'], [1, 'foo']]);

    expect(stripAnsi(diff(arg1, arg2))).toBe(
      'Compared values have no visual difference.',
    );
  });

  test('Set value order should be irrelevant', () => {
    const arg1 = new Set([1, 2]);
    const arg2 = new Set([2, 1]);

    expect(stripAnsi(diff(arg1, arg2))).toBe(
      'Compared values have no visual difference.',
    );
  });
});

test('oneline strings', () => {
  // oneline strings don't produce a diff currently.
  expect(stripAnsi(diff('ab', 'aa'))).toBe(null);
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
    '  line 1',
    '- line 2',
    '+ line  2',
    '  line 3',
    '  line 4',
  ];

  test('expand: false', () => {
    expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
  });
  test('expand: true', () => {
    expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
  });
});

describe('objects', () => {
  const a = {a: {b: {c: 5}}};
  const b = {a: {b: {c: 6}}};
  const expected = [
    '  Object {',
    '    "a": Object {',
    '      "b": Object {',
    '-       "c": 5,',
    '+       "c": 6,',
    '      },',
    '    },',
    '  }',
  ];

  test('expand: false', () => {
    expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
  });
  test('expand: true', () => {
    expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
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

describe('multiline string snapshot', () => {
  // For example, CLI output
  // Like a snapshot test of a string which has double quotes.
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
    '  "',
    '  Options:',
    '- --help, -h  Show help                            [boolean]',
    '- --bail, -b  Exit the test suite immediately upon the first',
    '-             failing test.                        [boolean]"',
    '+   --help, -h  Show help                            [boolean]',
    '+   --bail, -b  Exit the test suite immediately upon the first',
    '+               failing test.                        [boolean]"',
  ];

  test('expand: false', () => {
    expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
  });
  test('expand: true', () => {
    expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
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
    className: 'fun',
    props: {
      children: 'Goodbye',
    },
    type: 'div',
  };
  const expected = [
    '- <div',
    '-   className="fun"',
    '- >',
    '-   Hello',
    '+ <div>',
    '+   Goodbye',
    '  </div>',
  ];

  test('expand: false', () => {
    expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
  });
  test('expand: true', () => {
    expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
  });
});

test('collapses big diffs to patch format', () => {
  const result = diff(
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]},
    optFalse,
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

  describe('from less to more', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are more indented.
    const expected = [
      '  Object {',
      '    "searching": "",',
      '-   "sorting": Object {',
      '+   "sorting": Array [',
      '+     Object {',
      '        "descending": false,',
      '        "fieldKey": "what",',
      '      },',
      '+   ],',
      '  }',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
    });
  });

  describe('from more to less', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are less indented.
    const expected = [
      '  Object {',
      '    "searching": "",',
      '-   "sorting": Array [',
      '-     Object {',
      '+   "sorting": Object {',
      '      "descending": false,',
      '      "fieldKey": "what",',
      '    },',
      '-   ],',
      '  }',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(b, a, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(b, a, optTrue))).toMatch(expanded(expected));
    });
  });
});

describe('multiline string as property of JavaScript object', () => {
  // Unindented is safest in multiline strings:
  const a = {
    id: 'J',
    points: `0.5,0.460
0.25,0.875`,
  };
  const b = {
    id: 'J',
    points: `0.5,0.460
0.5,0.875
0.25,0.875`,
  };

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

  describe('unindented', () => {
    const expected = [
      '  Object {',
      '    "id": "J",',
      '    "points": "0.5,0.460',
      '+ 0.5,0.875',
      '  0.25,0.875",',
      '  }',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
    });
  });

  describe('indented', () => {
    const expected = [
      '  Object {',
      '    "id": "J",',
      '    "points": "0.5,0.460',
      '+       0.5,0.875',
      '        0.25,0.875",',
      '  }',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(aIn, bIn, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(aIn, bIn, optTrue))).toMatch(expanded(expected));
    });
  });

  describe('unindented to indented', () => {
    // Don’t ignore changes to indentation in a multiline string.
    const expected = [
      '  Object {',
      '    "id": "J",',
      '    "points": "0.5,0.460',
      '- 0.25,0.875",',
      '+       0.5,0.875',
      '+       0.25,0.875",',
      '  }',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(a, bIn, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(a, bIn, optTrue))).toMatch(expanded(expected));
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

  describe('from less to more', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are more indented.
    const expected = [
      '  <span>',
      '+   <strong>',
      '      <span>',
      '        text',
      '      </span>',
      '+   </strong>',
      '  </span>',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(a, b, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(a, b, optTrue))).toMatch(expanded(expected));
    });
  });

  describe('from more to less', () => {
    // Replace unchanged chunk in the middle with received lines,
    // which are less indented.
    const expected = [
      '  <span>',
      '-   <strong>',
      '    <span>',
      '      text',
      '    </span>',
      '-   </strong>',
      '  </span>',
    ];

    test('expand: false', () => {
      expect(stripAnsi(diff(b, a, optFalse))).toMatch(unexpanded(expected));
    });
    test('expand: true', () => {
      expect(stripAnsi(diff(b, a, optTrue))).toMatch(expanded(expected));
    });
  });
});
