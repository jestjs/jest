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

function received(a, b, options) {
  return stripAnsi(diff(a, b, options));
}

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
    test(`'${JSON.stringify(values[0])}' and '${JSON.stringify(
      values[1],
    )}'`, () => {
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
    expect(received(a, b, unexpanded)).toMatch(expected);
  });
  test('expanded', () => {
    expect(received(a, b, expanded)).toMatch(expected);
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

describe('indentation in JavaScript structures', () => {
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

    // Snapshots cannot distinguish indentation from leading spaces in text :(
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

    // Snapshots cannot distinguish indentation from leading spaces in text :(
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

    // Proposed serialization for multiline string value in objects.
    test('unexpanded snapshot', () => {
      expect(received(aUnSnap, bUnSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aUnSnap, bUnSnap, expanded)).toMatch(expected);
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

    // If change to serialization for multiline string value in objects,
    // then review the relevance of the following tests:
    test('unexpanded snapshot', () => {
      expect(received(aInSnap, bInSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aInSnap, bInSnap, expanded)).toMatch(expected);
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

    // If change to serialization for multiline string value in objects,
    // then review the relevance of the following tests:
    test('unexpanded snapshot', () => {
      expect(received(aUnSnap, bInSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aUnSnap, bInSnap, expanded)).toMatch(expected);
    });
  });
});

describe('indentation in React elements', () => {
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

    // Snapshots cannot distinguish indentation from leading spaces in text :(
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

    // Snapshots cannot distinguish indentation from leading spaces in text :(
  });
});

describe('spaces as text in React elements', () => {
  const value = 2;
  const unit = {
    $$typeof: elementSymbol,
    props: {
      children: ['m'],
      title: 'meters',
    },
    type: 'abbr',
  };
  const a = {
    $$typeof: elementSymbol,
    props: {
      children: [value, ' ', unit],
    },
    type: 'span',
  };
  const b = {
    $$typeof: elementSymbol,
    props: {
      children: [value, '  ', unit],
    },
    type: 'span',
  };
  const aSnap = [
    '<span>',
    '  2',
    '   ',
    '  <abbr',
    '    title="meters"',
    '  >',
    '    m',
    '  </abbr>',
    '</span>',
  ].join('\n');
  const bSnap = [
    '<span>',
    '  2',
    '    ',
    '  <abbr',
    '    title="meters"',
    '  >',
    '    m',
    '  </abbr>',
    '</span>',
  ].join('\n');

  describe('from less to more', () => {
    // Replace one space with two spaces.
    const expected = [
      ' <span>',
      '   2',
      '-   ',
      '+    ',
      '   <abbr',
      '     title="meters"',
      '   >',
      '     m',
      '   </abbr>',
      //' </span>', // unexpanded does not include this line
    ].join('\n');

    test('unexpanded', () => {
      expect(received(a, b, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(a, b, expanded)).toMatch(expected);
    });

    // Snapshots must display differences of leading spaces in text.
    test('unexpanded snapshot', () => {
      expect(received(aSnap, bSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aSnap, bSnap, expanded)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    // Replace two spaces with one space.
    const expected = [
      ' <span>',
      '   2',
      '-    ',
      '+   ',
      '   <abbr',
      '     title="meters"',
      '   >',
      '     m',
      '   </abbr>',
      //' </span>', // unexpanded does not include this line
    ].join('\n');

    test('unexpanded', () => {
      expect(received(b, a, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(b, a, expanded)).toMatch(expected);
    });

    // Snapshots must display differences of leading spaces in text.
    test('unexpanded snapshot', () => {
      expect(received(bSnap, aSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(bSnap, aSnap, expanded)).toMatch(expected);
    });
  });
});

describe('spaces at beginning or end of text in React elements', () => {
  const em = {
    $$typeof: elementSymbol,
    props: {
      children: ['already'],
    },
    type: 'em',
  };
  const a = {
    $$typeof: elementSymbol,
    props: {
      children: ['Jest is', em, 'configured'],
    },
    type: 'p',
  };
  const b = {
    $$typeof: elementSymbol,
    props: {
      children: ['Jest is ', em, ' configured'],
    },
    type: 'p',
  };
  const aSnap = [
    '<p>',
    '  Jest is',
    '  <em>',
    '    already',
    '  </em>',
    '  configured',
    '</p>',
  ].join('\n');
  const bSnap = [
    '<p>',
    '  Jest is ',
    '  <em>',
    '    already',
    '  </em>',
    '   configured',
    '</p>',
  ].join('\n');

  describe('from less to more', () => {
    // Replace no space with one space at edge of text nodes.
    const expected = [
      ' <p>',
      '-  Jest is',
      '+  Jest is ',
      '   <em>',
      '     already',
      '   </em>',
      '-  configured',
      '+   configured',
      ' </p>',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(a, b, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(a, b, expanded)).toMatch(expected);
    });

    // Snapshots must display differences of leading spaces in text.
    test('unexpanded snapshot', () => {
      expect(received(aSnap, bSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(aSnap, bSnap, expanded)).toMatch(expected);
    });
  });

  describe('from more to less', () => {
    // Replace one space with no space at edge of text nodes.
    const expected = [
      ' <p>',
      '-  Jest is ',
      '+  Jest is',
      '   <em>',
      '     already',
      '   </em>',
      '-   configured',
      '+  configured',
      ' </p>',
    ].join('\n');

    test('unexpanded', () => {
      expect(received(b, a, unexpanded)).toMatch(expected);
    });
    test('expanded', () => {
      expect(received(b, a, expanded)).toMatch(expected);
    });

    // Snapshots must display differences of leading spaces in text.
    test('unexpanded snapshot', () => {
      expect(received(bSnap, aSnap, unexpanded)).toMatch(expected);
    });
    test('expanded snapshot', () => {
      expect(received(bSnap, aSnap, expanded)).toMatch(expected);
    });
  });
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
