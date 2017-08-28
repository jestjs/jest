/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const stripAnsi = require('strip-ansi');
const diff = require('../');

const stripped = (a, b, options) => stripAnsi(diff(a, b, options));

const unexpanded = {expand: false};
const expanded = {expand: true};

const elementSymbol = Symbol.for('react.element');

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

    test(`'${String(a)}' and '${String(b)}'`, () => {
      expect(stripped(a, b)).toBe(
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
    test(`'${JSON.stringify(values[0])}' and '${JSON.stringify(
      values[1],
    )}'`, () => {
      expect(stripped(values[0], values[1])).toBe(
        'Compared values have no visual difference.',
      );
    });
  });

  test('Map key order should be irrelevant', () => {
    const arg1 = new Map([[1, 'foo'], [2, 'bar']]);
    const arg2 = new Map([[2, 'bar'], [1, 'foo']]);

    expect(stripped(arg1, arg2)).toBe(
      'Compared values have no visual difference.',
    );
  });

  test('Set value order should be irrelevant', () => {
    const arg1 = new Set([1, 2]);
    const arg2 = new Set([2, 1]);

    expect(stripped(arg1, arg2)).toBe(
      'Compared values have no visual difference.',
    );
  });
});

test('oneline strings', () => {
  // oneline strings don't produce a diff currently.
  expect(diff('ab', 'aa')).toBe(null);
  expect(diff('a', 'a')).toMatch(/no visual difference/);
  expect(diff('123456789', '234567890')).toBe(null);
  // if either string is oneline
  expect(diff('oneline', 'multi\nline')).toBe(null);
  expect(diff('multi\nline', 'oneline')).toBe(null);
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
    ' line 1',
    '-line 2',
    '+line  2',
    ' line 3',
    ' line 4',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(stripped(a, b, unexpanded)).toMatch(expected);
  });
  test('(expanded)', () => {
    expect(stripped(a, b, expanded)).toMatch(expected);
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

  test('(unexpanded)', () => {
    expect(stripped(a, b, unexpanded)).toMatch(expected);
  });
  test('(expanded)', () => {
    expect(stripped(a, b, expanded)).toMatch(expected);
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

  test('(unexpanded)', () => {
    expect(stripped(a, b, unexpanded)).toMatch(expected);
  });
  test('(expanded)', () => {
    expect(stripped(a, b, expanded)).toMatch(expected);
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

  test('(unexpanded)', () => {
    expect(stripped(a, b, unexpanded)).toMatch(expected);
  });
  test('(expanded)', () => {
    expect(stripped(a, b, expanded)).toMatch(expected);
  });
});

describe('React elements', () => {
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
    ' <div',
    '   className="fun"',
    ' >',
    '-  Hello',
    '+  Goodbye',
    ' </div>',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(stripped(a, b, unexpanded)).toMatch(expected);
  });
  test('(expanded)', () => {
    expect(stripped(a, b, expanded)).toMatch(expected);
  });
});

describe('multiline string as value of object property', () => {
  const expected = [
    ' Object {',
    '   "id": "J",',
    '   "points": "0.5,0.460',
    '+0.5,0.875',
    ' 0.25,0.875",',
    ' }',
  ].join('\n');

  describe('(non-snapshot)', () => {
    const a = {
      id: 'J',
      points: '0.5,0.460\n0.25,0.875',
    };
    const b = {
      id: 'J',
      points: '0.5,0.460\n0.5,0.875\n0.25,0.875',
    };
    test('(unexpanded)', () => {
      expect(stripped(a, b, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(a, b, expanded)).toMatch(expected);
    });
  });

  describe('(snapshot)', () => {
    const a = [
      'Object {',
      '  "id": "J",',
      '  "points": "0.5,0.460',
      '0.25,0.875",',
      '}',
    ].join('\n');
    const b = [
      'Object {',
      '  "id": "J",',
      '  "points": "0.5,0.460',
      '0.5,0.875',
      '0.25,0.875",',
      '}',
    ].join('\n');
    test('(unexpanded)', () => {
      expect(stripped(a, b, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(a, b, expanded)).toMatch(expected);
    });
  });
});

describe('indentation in JavaScript structures', () => {
  const searching = '';
  const object = {
    descending: false,
    fieldKey: 'what',
  };
  const a = {
    searching,
    sorting: object,
  };
  const b = {
    searching,
    sorting: [object],
  };

  describe('from less to more', () => {
    const expected = [
      ' Object {',
      '   "searching": "",',
      '-  "sorting": Object {',
      '+  "sorting": Array [',
      '+    Object {',
      // following 3 lines are unchanged, except for more indentation
      '       "descending": false,',
      '       "fieldKey": "what",',
      '     },',
      '+  ],',
      ' }',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(a, b, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(a, b, expanded)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    const expected = [
      ' Object {',
      '   "searching": "",',
      '-  "sorting": Array [',
      '-    Object {',
      '+  "sorting": Object {',
      // following 3 lines are unchanged, except for less indentation
      '     "descending": false,',
      '     "fieldKey": "what",',
      '   },',
      '-  ],',
      ' }',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(b, a, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(b, a, expanded)).toMatch(expected);
    });
  });
});

describe('color of text', () => {
  const searching = '';
  const object = {
    descending: false,
    fieldKey: 'what',
  };
  const a = {
    searching,
    sorting: object,
  };
  const b = {
    searching,
    sorting: [object],
  };

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpanded)).toMatchSnapshot();
  });
  test('(expanded)', () => {
    expect(diff(a, b, expanded)).toMatchSnapshot();
  });
});

describe('indentation in React elements (non-snapshot)', () => {
  const leaf = {
    $$typeof: elementSymbol,
    props: {
      children: ['text'],
    },
    type: 'span',
  };
  const a = {
    $$typeof: elementSymbol,
    props: {
      children: [leaf],
    },
    type: 'span',
  };
  const b = {
    $$typeof: elementSymbol,
    props: {
      children: [
        {
          $$typeof: elementSymbol,
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
    const expected = [
      ' <span>',
      '+  <strong>',
      // following 3 lines are unchanged, except for more indentation
      '     <span>',
      '       text',
      '     </span>',
      '+  </strong>',
      ' </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(a, b, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(a, b, expanded)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    const expected = [
      ' <span>',
      '-  <strong>',
      // following 3 lines are unchanged, except for less indentation
      '   <span>',
      '     text',
      '   </span>',
      '-  </strong>',
      ' </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(b, a, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(b, a, expanded)).toMatch(expected);
    });
  });
});

describe('indentation in React elements (snapshot)', () => {
  // prettier-ignore
  const a = [
    '<span>',
    '  <span>',
    '    text',
    '  </span>',
    '</span>',
  ].join('\n');
  const b = [
    '<span>',
    '  <strong>',
    '    <span>',
    '      text',
    '    </span>',
    '  </strong>',
    '</span>',
  ].join('\n');

  describe('from less to more', () => {
    // We intend to improve snapshot diff in the next version of Jest.
    const expected = [
      ' <span>',
      '-  <span>',
      '-    text',
      '-  </span>',
      '+  <strong>',
      '+    <span>',
      '+      text',
      '+    </span>',
      '+  </strong>',
      ' </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(a, b, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(a, b, expanded)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    // We intend to improve snapshot diff in the next version of Jest.
    const expected = [
      ' <span>',
      '-  <strong>',
      '-    <span>',
      '-      text',
      '-    </span>',
      '-  </strong>',
      '+  <span>',
      '+    text',
      '+  </span>',
      ' </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(stripped(b, a, unexpanded)).toMatch(expected);
    });
    test('(expanded)', () => {
      expect(stripped(b, a, expanded)).toMatch(expected);
    });
  });
});

describe('background color of spaces', () => {
  const baseline = {
    $$typeof: elementSymbol,
    props: {
      children: [
        {
          $$typeof: elementSymbol,
          props: {
            children: [''],
          },
          type: 'span',
        },
      ],
    },
    type: 'div',
  };
  const lines = [
    'following string consists of a space:',
    ' ',
    ' line has preceding space only',
    ' line has both preceding and following space ',
    'line has following space only ',
  ];
  const examples = {
    $$typeof: elementSymbol,
    props: {
      children: [
        {
          $$typeof: elementSymbol,
          props: {
            children: lines,
          },
          type: 'span',
        },
      ],
    },
    type: 'div',
  };
  const unchanged = {
    $$typeof: elementSymbol,
    props: {
      children: [
        {
          $$typeof: elementSymbol,
          props: {
            children: lines,
          },
          type: 'p',
        },
      ],
    },
    type: 'div',
  };
  const inchanged = {
    $$typeof: elementSymbol,
    props: {
      children: [
        {
          $$typeof: elementSymbol,
          props: {
            children: [
              {
                $$typeof: elementSymbol,
                props: {
                  children: [lines],
                },
                type: 'span',
              },
            ],
          },
          type: 'p',
        },
      ],
    },
    type: 'div',
  };

  describe('(unexpanded)', () => {
    test('added is red', () => {
      expect(diff(baseline, examples, unexpanded)).toMatchSnapshot();
    });
    test('removed is green', () => {
      expect(diff(examples, baseline, unexpanded)).toMatchSnapshot();
    });
    test('unchanged has no color', () => {
      expect(diff(examples, unchanged, unexpanded)).toMatchSnapshot();
    });
    test('inchanged is cyan', () => {
      expect(diff(examples, inchanged, unexpanded)).toMatchSnapshot();
    });
  });

  describe('(expanded)', () => {
    test('added is red', () => {
      expect(diff(baseline, examples, expanded)).toMatchSnapshot();
    });
    test('removed is green', () => {
      expect(diff(examples, baseline, expanded)).toMatchSnapshot();
    });
    test('unchanged has no color', () => {
      expect(diff(examples, unchanged, expanded)).toMatchSnapshot();
    });
    test('inchanged is cyan', () => {
      expect(diff(examples, inchanged, expanded)).toMatchSnapshot();
    });
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

describe('context', () => {
  const testDiffContextLines = (contextLines?: number) => {
    test(`number of lines: ${typeof contextLines === 'number'
      ? contextLines
      : 'null'} ${typeof contextLines !== 'number' || contextLines < 0
      ? '(5 default)'
      : ''}`, () => {
      const result = diff(
        {test: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
        {test: [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]},
        {
          contextLines,
          expand: false,
        },
      );
      expect(result).toMatchSnapshot();
    });
  };

  testDiffContextLines(); // 5 by default
  testDiffContextLines(2);
  testDiffContextLines(1);
  testDiffContextLines(0);
  testDiffContextLines(-1); // Will use default
});
