/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';
import stripAnsi = require('strip-ansi');
import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import {diff} from '../';
import {NO_DIFF_MESSAGE} from '../constants';
import {diffLinesUnified, diffLinesUnified2} from '../diffLines';
import {noColor} from '../normalizeDiffOptions';
import {diffStringsUnified} from '../printDiffs';
import type {DiffOptions} from '../types';

const optionsCounts: DiffOptions = {
  includeChangeCounts: true,
};

// Use only in toBe assertions for edge case messages.
const stripped = (a: unknown, b: unknown) => stripAnsi(diff(a, b) ?? '');

// Use in toBe assertions for comparison lines.
const optionsBe: DiffOptions = {
  aColor: noColor,
  bColor: noColor,
  commonColor: noColor,
  omitAnnotationLines: true,
};
const unexpandedBe: DiffOptions = {
  ...optionsBe,
  expand: false,
};
const expandedBe: DiffOptions = {
  ...optionsBe,
  expand: true,
};

// Use for toMatchSnapshot assertions.
const unexpanded = {expand: false};
const expanded = {expand: true};

const elementSymbol = Symbol.for('react.element');

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

describe('different types', () => {
  for (const values of [
    [1, 'a', 'number', 'string'],
    [{}, 'a', 'object', 'string'],
    [[], 2, 'array', 'number'],
    [null, undefined, 'null', 'undefined'],
    [() => {}, 3, 'function', 'number'],
  ]) {
    const a = values[0];
    const b = values[1];
    const typeA = values[2];
    const typeB = values[3];

    test(`'${String(a)}' and '${String(b)}'`, () => {
      expect(stripped(a, b)).toBe(
        '  Comparing two different types of values. ' +
          `Expected ${String(typeA)} but received ${String(typeB)}.`,
      );
    });
  }
});

describe('no visual difference', () => {
  for (const values of [
    ['a', 'a'],
    [{}, {}],
    [[], []],
    [
      [1, 2],
      [1, 2],
    ],
    [11, 11],
    /* eslint-disable unicorn/prefer-number-properties */
    [NaN, NaN],
    [Number.NaN, NaN],
    /* eslint-enable */
    [() => {}, () => {}],
    [null, null],
    [undefined, undefined],
    [false, false],
    [{a: 1}, {a: 1}],
    [{a: {b: 5}}, {a: {b: 5}}],
  ]) {
    test(`'${JSON.stringify(values[0])}' and '${JSON.stringify(
      values[1],
    )}'`, () => {
      expect(stripped(values[0], values[1])).toBe(NO_DIFF_MESSAGE);
    });
  }

  test('Map key order should be irrelevant', () => {
    const arg1 = new Map([
      [1, 'foo'],
      [2, 'bar'],
    ]);
    const arg2 = new Map([
      [2, 'bar'],
      [1, 'foo'],
    ]);

    expect(stripped(arg1, arg2)).toBe(NO_DIFF_MESSAGE);
  });

  test('Set value order should be irrelevant', () => {
    const arg1 = new Set([1, 2]);
    const arg2 = new Set([2, 1]);

    expect(stripped(arg1, arg2)).toBe(NO_DIFF_MESSAGE);
  });
});

test('oneline strings', () => {
  expect(diff('ab', 'aa', optionsCounts)).toMatchSnapshot();
  expect(diff('123456789', '234567890', optionsCounts)).toMatchSnapshot();
  expect(diff('oneline', 'multi\nline', optionsCounts)).toMatchSnapshot();
  expect(diff('multi\nline', 'oneline', optionsCounts)).toMatchSnapshot();
});

describe('falls back to not call toJSON', () => {
  describe('if serialization has no differences', () => {
    const toJSON = function toJSON() {
      return 'it’s all the same to me';
    };

    test('but then objects have differences', () => {
      const a = {line: 1, toJSON};
      const b = {line: 2, toJSON};
      expect(diff(a, b, optionsCounts)).toMatchSnapshot();
    });
    test('and then objects have no differences', () => {
      const a = {line: 2, toJSON};
      const b = {line: 2, toJSON};
      expect(stripped(a, b)).toBe(NO_DIFF_MESSAGE);
    });
  });
  describe('if it throws', () => {
    const toJSON = function toJSON() {
      throw new Error('catch me if you can');
    };

    test('and then objects have differences', () => {
      const a = {line: 1, toJSON};
      const b = {line: 2, toJSON};
      expect(diff(a, b, optionsCounts)).toMatchSnapshot();
    });
    test('and then objects have no differences', () => {
      const a = {line: 2, toJSON};
      const b = {line: 2, toJSON};
      expect(stripped(a, b)).toBe(NO_DIFF_MESSAGE);
    });
  });
});

// Some of the following assertions seem complex, but compare to alternatives:
// * toBe instead of toMatchSnapshot:
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
  ].join('\n');

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpandedBe)).toBe(expected);
  });
  test('(expanded)', () => {
    expect(diff(a, b, expandedBe)).toBe(expected);
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
  ].join('\n');

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpandedBe)).toBe(expected);
  });
  test('(expanded)', () => {
    expect(diff(a, b, expandedBe)).toBe(expected);
  });
});

test('numbers', () => {
  expect(diff(1, 2, optionsBe)).toBe('- 1\n+ 2');
});

test('-0 and 0', () => {
  expect(diff(-0, 0, optionsBe)).toBe('- -0\n+ 0');
});

test('booleans', () => {
  expect(diff(false, true, optionsBe)).toBe('- false\n+ true');
});

describe('multiline string non-snapshot', () => {
  // For example, CLI output
  // toBe or toEqual for a string isn’t enclosed in double quotes.
  const a = `Options:
--help, -h  Show help                            [boolean]
--bail, -b  Exit the test suite immediately upon the first
            failing test.                        [boolean]`;
  const b = `Options:
  --help, -h  Show help                            [boolean]
  --bail, -b  Exit the test suite immediately upon the first
              failing test.                        [boolean]`;
  const expected = [
    '  Options:',
    '- --help, -h  Show help                            [boolean]',
    '- --bail, -b  Exit the test suite immediately upon the first',
    '-             failing test.                        [boolean]',
    '+   --help, -h  Show help                            [boolean]',
    '+   --bail, -b  Exit the test suite immediately upon the first',
    '+               failing test.                        [boolean]',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpandedBe)).toBe(expected);
  });
  test('(expanded)', () => {
    expect(diff(a, b, expandedBe)).toBe(expected);
  });
});

describe('multiline string snapshot', () => {
  // For example, CLI output
  // A snapshot of a string is enclosed in double quotes.
  const a = `"
Options:
--help, -h  Show help                            [boolean]
--bail, -b  Exit the test suite immediately upon the first
            failing test.                        [boolean]"`;
  const b = `"
Options:
  --help, -h  Show help                            [boolean]
  --bail, -b  Exit the test suite immediately upon the first
              failing test.                        [boolean]"`;
  const expected = [
    '  "',
    '  Options:',
    '- --help, -h  Show help                            [boolean]',
    '- --bail, -b  Exit the test suite immediately upon the first',
    '-             failing test.                        [boolean]"',
    '+   --help, -h  Show help                            [boolean]',
    '+   --bail, -b  Exit the test suite immediately upon the first',
    '+               failing test.                        [boolean]"',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpandedBe)).toBe(expected);
  });
  test('(expanded)', () => {
    expect(diff(a, b, expandedBe)).toBe(expected);
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
    '  <div',
    '    className="fun"',
    '  >',
    '-   Hello',
    '+   Goodbye',
    '  </div>',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(diff(a, b, unexpandedBe)).toBe(expected);
  });
  test('(expanded)', () => {
    expect(diff(a, b, expandedBe)).toBe(expected);
  });
});

describe('multiline string as value of object property', () => {
  const expected = [
    '  Object {',
    '    "id": "J",',
    '    "points": "0.5,0.460',
    '+ 0.5,0.875',
    '  0.25,0.875",',
    '  }',
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
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
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
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
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
      '  Object {',
      '    "searching": "",',
      '-   "sorting": Object {',
      '+   "sorting": Array [',
      '+     Object {',
      // following 3 lines are unchanged, except for more indentation
      '        "descending": false,',
      '        "fieldKey": "what",',
      '      },',
      '+   ],',
      '  }',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
    });
  });

  describe('from more to less', () => {
    const expected = [
      '  Object {',
      '    "searching": "",',
      '-   "sorting": Array [',
      '-     Object {',
      '+   "sorting": Object {',
      // following 3 lines are unchanged, except for less indentation
      '      "descending": false,',
      '      "fieldKey": "what",',
      '    },',
      '-   ],',
      '  }',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(b, a, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(b, a, expandedBe)).toBe(expected);
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
  const received = diff(a, b, expanded);

  test('(expanded)', () => {
    expect(received).toMatchSnapshot();
  });
  test('(unexpanded)', () => {
    // Expect same result, unless diff is long enough to require patch marks.
    expect(diff(a, b, unexpanded)).toBe(received);
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
      '  <span>',
      '+   <strong>',
      // following 3 lines are unchanged, except for more indentation
      '      <span>',
      '        text',
      '      </span>',
      '+   </strong>',
      '  </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
    });
  });

  describe('from more to less', () => {
    const expected = [
      '  <span>',
      '-   <strong>',
      // following 3 lines are unchanged, except for less indentation
      '    <span>',
      '      text',
      '    </span>',
      '-   </strong>',
      '  </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(b, a, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(b, a, expandedBe)).toBe(expected);
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
      '  <span>',
      '-   <span>',
      '-     text',
      '-   </span>',
      '+   <strong>',
      '+     <span>',
      '+       text',
      '+     </span>',
      '+   </strong>',
      '  </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
    });
  });

  describe('from more to less', () => {
    // We intend to improve snapshot diff in the next version of Jest.
    const expected = [
      '  <span>',
      '-   <strong>',
      '-     <span>',
      '-       text',
      '-     </span>',
      '-   </strong>',
      '+   <span>',
      '+     text',
      '+   </span>',
      '  </span>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(b, a, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(b, a, expandedBe)).toBe(expected);
    });
  });
});

describe('outer React element (non-snapshot)', () => {
  const a = {
    $$typeof: elementSymbol,
    props: {
      children: 'Jest',
    },
    type: 'h1',
  };
  const b = {
    $$typeof: elementSymbol,
    props: {
      children: [
        a,
        {
          $$typeof: elementSymbol,
          props: {
            children: 'Delightful JavaScript Testing',
          },
          type: 'h2',
        },
      ],
    },
    type: 'header',
  };

  describe('from less to more', () => {
    const expected = [
      '+ <header>',
      // following 3 lines are unchanged, except for more indentation
      '    <h1>',
      '      Jest',
      '    </h1>',
      '+   <h2>',
      '+     Delightful JavaScript Testing',
      '+   </h2>',
      '+ </header>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
    });
  });

  describe('from more to less', () => {
    const expected = [
      '- <header>',
      // following 3 lines are unchanged, except for less indentation
      '  <h1>',
      '    Jest',
      '  </h1>',
      '-   <h2>',
      '-     Delightful JavaScript Testing',
      '-   </h2>',
      '- </header>',
    ].join('\n');

    test('(unexpanded)', () => {
      expect(diff(b, a, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(b, a, expandedBe)).toBe(expected);
    });
  });
});

describe('trailing newline in multiline string not enclosed in quotes', () => {
  const a = ['line 1', 'line 2', 'line 3'].join('\n');
  const b = `${a}\n`;

  describe('from less to more', () => {
    const expected = ['  line 1', '  line 2', '  line 3', '+'].join('\n');

    test('(unexpanded)', () => {
      expect(diff(a, b, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(a, b, expandedBe)).toBe(expected);
    });
  });

  describe('from more to less', () => {
    const expected = ['  line 1', '  line 2', '  line 3', '-'].join('\n');

    test('(unexpanded)', () => {
      expect(diff(b, a, unexpandedBe)).toBe(expected);
    });
    test('(expanded)', () => {
      expect(diff(b, a, expandedBe)).toBe(expected);
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
    const validContextLines =
      typeof contextLines === 'number' &&
      Number.isSafeInteger(contextLines) &&
      contextLines >= 0;

    test(`number of lines: ${
      typeof contextLines === 'number' ? contextLines : 'undefined'
    } ${validContextLines ? '' : '(5 default)'}`, () => {
      const options = {
        ...optionsCounts,
        contextLines,
        expand: false,
      };
      if (!validContextLines) {
        options.patchColor = pico.dim;
      }

      const result = diff(
        {test: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
        {test: [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]},
        options,
      );
      expect(result).toMatchSnapshot();
    });
  };

  testDiffContextLines(-1); // (5 default)
  testDiffContextLines(0);
  testDiffContextLines(1);
  testDiffContextLines(2);
  testDiffContextLines(3.1); // (5 default)
  testDiffContextLines(); // (5 default)
});

describe('diffLinesUnified edge cases', () => {
  test('a empty string b empty string', () => {
    const a = '';
    const b = '';

    const received = diffLinesUnified(a.split('\n'), b.split('\n'), optionsBe);
    const expected = '';

    expect(received).toBe(expected);
  });

  test('a empty string b one line', () => {
    const a = '';
    const b = 'line 1';

    const received = diffLinesUnified(a.split('\n'), b.split('\n'), optionsBe);
    const expected = '+ line 1';

    expect(received).toBe(expected);
  });

  test('a multiple lines b empty string', () => {
    const a = 'line 1\n\nline 3';
    const b = '';

    const received = diffLinesUnified(a.split('\n'), b.split('\n'), optionsBe);
    const expected = '- line 1\n-\n- line 3';

    expect(received).toBe(expected);
  });

  test('a one line b multiple lines', () => {
    const a = 'line 2';
    const b = 'line 1\nline 2\nline 3';

    const received = diffLinesUnified(a.split('\n'), b.split('\n'), optionsBe);
    const expected = '+ line 1\n  line 2\n+ line 3';

    expect(received).toBe(expected);
  });
});

describe('diffLinesUnified2 edge cases', () => {
  test('a empty string b empty string', () => {
    const a = '';
    const b = '';

    const received = diffLinesUnified2(
      a.split('\n'),
      b.split('\n'),
      a.split('\n'),
      b.split('\n'),
      optionsBe,
    );
    const expected = '';

    expect(received).toBe(expected);
  });

  test('a empty string b one line', () => {
    const a = '';
    const b = 'line 1';

    const received = diffLinesUnified2(
      a.split('\n'),
      b.split('\n'),
      a.split('\n'),
      b.split('\n'),
      optionsBe,
    );
    const expected = '+ line 1';

    expect(received).toBe(expected);
  });

  test('a multiple lines b empty string', () => {
    const a = 'line 1\n\nline 3';
    const b = '';

    const received = diffLinesUnified2(
      a.split('\n'),
      b.split('\n'),
      a.split('\n'),
      b.split('\n'),
      optionsBe,
    );
    const expected = '- line 1\n-\n- line 3';

    expect(received).toBe(expected);
  });

  test('a one line b multiple lines', () => {
    const aDisplay = 'LINE 2';
    const bDisplay = 'Line 1\nLine 2\nLine 3';
    const aCompare = aDisplay.toLowerCase();
    const bCompare = bDisplay.toLowerCase();

    const received = diffLinesUnified2(
      aDisplay.split('\n'),
      bDisplay.split('\n'),
      aCompare.split('\n'),
      bCompare.split('\n'),
      optionsBe,
    );
    const expected = '+ Line 1\n  Line 2\n+ Line 3';

    expect(received).toBe(expected);
  });

  describe('lengths not equal', () => {
    // Fall back to diff of display lines.

    test('a', () => {
      const aDisplay = 'MiXeD cAsE';
      const bDisplay = 'Mixed case\nUPPER CASE';
      const aCompare = `${aDisplay.toLowerCase()}\nlower case`;
      const bCompare = bDisplay.toLowerCase();

      const received = diffLinesUnified2(
        aDisplay.split('\n'),
        bDisplay.split('\n'),
        aCompare.split('\n'),
        bCompare.split('\n'),
        optionsBe,
      );
      const expected = '- MiXeD cAsE\n+ Mixed case\n+ UPPER CASE';

      expect(received).toBe(expected);
    });

    test('b', () => {
      const aDisplay = '{\n  "key": "value",\n}';
      const bDisplay = '{\n}';
      const aCompare = '{\n"key": "value",\n}';
      const bCompare = '{}';

      const expected = '  {\n-   "key": "value",\n  }';
      const received = diffLinesUnified2(
        aDisplay.split('\n'),
        bDisplay.split('\n'),
        aCompare.split('\n'),
        bCompare.split('\n'),
        optionsBe,
      );

      expect(received).toBe(expected);
    });
  });
});

describe('diffStringsUnified edge cases', () => {
  test('empty both a and b', () => {
    const a = '';
    const b = '';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });

  test('empty only a', () => {
    const a = '';
    const b = 'one-line string';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });

  test('empty only b', () => {
    const a = 'one-line string';
    const b = '';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });

  test('equal both non-empty', () => {
    const a = 'one-line string';
    const b = 'one-line string';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });

  test('multiline has no common after clean up chaff', () => {
    const a = 'delete\ntwo';
    const b = 'insert\n2';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });

  test('one-line has no common after clean up chaff', () => {
    const a = 'delete';
    const b = 'insert';

    expect(diffStringsUnified(a, b, optionsCounts)).toMatchSnapshot();
  });
});

describe('options 7980', () => {
  const a =
    '`${Ti.App.name} ${Ti.App.version} ${Ti.Platform.name} ${Ti.Platform.version}`';
  const b =
    '`${Ti.App.getName()} ${Ti.App.getVersion()} ${Ti.Platform.getName()} ${Ti.Platform.getVersion()}`';

  const options = {
    aAnnotation: 'Original',
    aColor: pico.red,
    bAnnotation: 'Modified',
    bColor: pico.green,
  };

  test('diff', () => {
    expect(diff(a, b, options)).toMatchSnapshot();
  });

  test('diffStringsUnified', () => {
    expect(diffStringsUnified(a, b, options)).toMatchSnapshot();
  });
});

describe('options', () => {
  const a = ['delete', 'change from', 'common'];
  const b = ['change to', 'insert', 'common'];

  const aString = 'change from\ncommon'; // without delete
  const bString = 'change to\ncommon'; // without insert

  describe('change indicators', () => {
    const options = {
      aIndicator: '<',
      bIndicator: '>',
    };

    test('diff', () => {
      expect(diff(a, b, options)).toMatchSnapshot();
    });
  });

  describe('change color', () => {
    const options = {
      changeColor: pico.bold,
      commonColor: pico.yellow,
    };

    test('diffStringsUnified', () => {
      const aChanged = a.join('\n').replace('change', 'changed');
      const bChanged = b.join('\n').replace('change', 'changed');
      expect(diffStringsUnified(aChanged, bChanged, options)).toMatchSnapshot();
    });

    test('no diff', () => {
      expect(diff(a, a, options)).toMatchSnapshot();
    });
  });

  describe('common', () => {
    const options = {
      commonColor: noColor,
      commonIndicator: '=',
    };

    test('diff', () => {
      expect(diff(a, b, options)).toMatchSnapshot();
    });

    test('no diff', () => {
      expect(diff(a, a, options)).toBe(NO_DIFF_MESSAGE);
    });
  });

  describe('includeChangeCounts false', () => {
    const options = {
      includeChangeCounts: false,
    };

    test('diffLinesUnified', () => {
      expect(diff(a, b, options)).toMatchSnapshot();
    });

    test('diffStringsUnified', () => {
      expect(diffStringsUnified(aString, bString, options)).toMatchSnapshot();
    });
  });

  describe('includeChangeCounts true padding', () => {
    const options = {
      aAnnotation: 'Before',
      bAnnotation: 'After',
      includeChangeCounts: true,
    };

    test('diffLinesUnified a has 2 digits', () => {
      const has2 = 'common\na\na\na\na\na\na\na\na\na\na';
      const has1 = 'common\nb';
      expect(diff(has2, has1, options)).toMatchSnapshot();
    });

    test('diffLinesUnified b has 2 digits', () => {
      const has1 = 'common\na';
      const has2 = 'common\nb\nb\nb\nb\nb\nb\nb\nb\nb\nb';
      expect(diff(has1, has2, options)).toMatchSnapshot();
    });

    test('diffStringsUnified', () => {
      expect(diffStringsUnified(aString, bString, options)).toMatchSnapshot();
    });
  });

  describe('omitAnnotationLines true', () => {
    const options = {
      omitAnnotationLines: true,
    };

    test('diff', () => {
      expect(diff(a, b, options)).toMatchSnapshot();
    });

    test('diffStringsUnified and includeChangeCounts true', () => {
      const options2 = {...options, includeChangeCounts: true};

      expect(diffStringsUnified(aString, bString, options2)).toMatchSnapshot();
    });

    test('diffStringsUnified empty strings', () => {
      expect(diffStringsUnified('', '', options)).toMatchSnapshot();
    });
  });

  describe('trailingSpaceFormatter', () => {
    const aTrailingSpaces = [
      'delete 1 trailing space: ',
      'common 2 trailing spaces:  ',
      'insert 1 trailing space:',
    ].join('\n');
    const bTrailingSpaces = [
      'delete 1 trailing space:',
      'common 2 trailing spaces:  ',
      'insert 1 trailing space: ',
    ].join('\n');

    test('diff default no color', () => {
      expect(diff(aTrailingSpaces, bTrailingSpaces)).toMatchSnapshot();
    });

    test('diff middle dot', () => {
      const replaceSpacesWithMiddleDot = (string: string) =>
        '·'.repeat(string.length);
      const options = {
        changeLineTrailingSpaceColor: replaceSpacesWithMiddleDot,
        commonLineTrailingSpaceColor: replaceSpacesWithMiddleDot,
      };

      expect(diff(aTrailingSpaces, bTrailingSpaces, options)).toMatchSnapshot();
    });

    test('diff yellowish common', () => {
      const options = {
        commonLineTrailingSpaceColor: pico.bgYellow,
      };

      expect(diff(aTrailingSpaces, bTrailingSpaces, options)).toMatchSnapshot();
    });
  });

  describe('emptyFirstOrLastLinePlaceholder default empty string', () => {
    const options = {
      ...optionsBe,
      changeColor: noColor,
    };

    const aEmpty = '\ncommon\nchanged from\n';
    const bEmpty = '\ncommon\nchanged to\n';

    const expected = [
      '',
      '  common',
      '- changed from',
      '+ changed to',
      '',
    ].join('\n');

    test('diff', () => {
      expect(diff(aEmpty, bEmpty, options)).toBe(expected);
    });

    test('diffStringsUnified', () => {
      expect(diffStringsUnified(aEmpty, bEmpty, options)).toBe(expected);
    });
  });

  describe('compare keys', () => {
    const a = {a: {d: 1, e: 1, f: 1}, b: 1, c: 1};
    const b = {a: {d: 1, e: 2, f: 1}, b: 1, c: 1};

    test('keeps the object keys in their original order', () => {
      const compareKeys = () => 0;
      const expected = [
        '  Object {',
        '    "a": Object {',
        '      "d": 1,',
        '-     "e": 1,',
        '+     "e": 2,',
        '      "f": 1,',
        '    },',
        '    "b": 1,',
        '    "c": 1,',
        '  }',
      ].join('\n');
      expect(diff(a, b, {...optionsBe, compareKeys})).toBe(expected);
    });

    test('sorts the object keys in reverse order', () => {
      const compareKeys = (a: string, b: string) => (a > b ? -1 : 1);
      const expected = [
        '  Object {',
        '    "c": 1,',
        '    "b": 1,',
        '    "a": Object {',
        '      "f": 1,',
        '-     "e": 1,',
        '+     "e": 2,',
        '      "d": 1,',
        '    },',
        '  }',
      ].join('\n');
      expect(diff(a, b, {...optionsBe, compareKeys})).toBe(expected);
    });
  });
});
