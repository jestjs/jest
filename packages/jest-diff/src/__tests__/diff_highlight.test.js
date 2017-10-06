/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const diff = require('../');

const ansiRegex = require('ansi-regex');
const styles = require('ansi-styles');

// Return diff without irrelevant escape sequences nor Expected/Received.
const stripDiff = (a, b, options) => {
  const result = diff(a, b, options);
  return (
    result &&
    result
      .replace(ansiRegex(), (match, offset, string) => {
        switch (match) {
          case styles.inverse.open:
            return '<inverse>';
          case styles.inverse.close:
            return '</>';
          // Not directly related to changed strings,
          // but snapshots of highlight are confusing without bgYellow:
          case styles.bgYellow.open:
            return '<bgYellow>';
          case styles.bgYellow.close:
            return '</>';
          default:
            return '';
        }
      })
      .replace('- Expected\n+ Received\n\n', '')
  );
};

// If the third argument for options is omitted, then it is unexpanded.
const unexpanded = {expand: false};
const expanded = {expand: true};

// Create elements without react in devDependencies :)
const elementSymbol = Symbol.for('react.element');
const createElement = (type: string, props: ?Object, ...children) => ({
  $$typeof: elementSymbol,
  props:
    children.length !== 0
      ? props ? Object.assign({}, props, {children}) : {children}
      : props,
  type,
});

describe('strings at beginning of line', () => {
  // Progress scenario: data structure changes [especially from more to less]
  const x = 0.25;
  const y = 0.875;
  const less = [[x, y]];
  const more = [{x, y}];

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('string at end of line and break too', () => {
  // Progress scenario: data structure changes [especially from less to more]
  const searching = '';
  const object = {
    descending: false,
    fieldKey: 'when',
  };
  const less = {
    searching,
    sorting: object,
  };
  const more = {
    searching,
    sorting: [object],
  };

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('strings within line', () => {
  // Regress scenario: simulated click fails
  const thProps = {
    onClick: () => {},
  };
  const text = 'when';
  const correct = createElement(
    'th',
    thProps,
    text,
    createElement(
      'abbr',
      {title: 'descending'},
      '\u25BC', // black down-pointing triangle
    ),
  );
  const incorrect = createElement(
    'th',
    thProps,
    text,
    createElement(
      'abbr',
      {title: 'ascending'},
      '\u25B2', // black up-pointing triangle
    ),
  );

  describe('from correct to incorrect', () => {
    const received = stripDiff(correct, incorrect, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(correct, incorrect, unexpanded)).toBe(received);
    });
  });
  describe('from incorrect to correct', () => {
    const received = stripDiff(incorrect, correct, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(incorrect, correct, unexpanded)).toBe(received);
    });
  });
});

describe('props change keys', () => {
  // Progress scenario: component changes to become more reusable
  // If separated by unchanged prop, the changed lines are not adjacent.
  const text = 'Complete and easy to set-up JavaScript testing solution.';
  const title = 'Easy Setup';
  const improved = createElement('Item', {
    text,
    title,
  });
  const original = createElement('Item', {
    description: text,
    heading: title,
  });

  describe('from improved to original', () => {
    const received = stripDiff(improved, original, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(improved, original, unexpanded)).toBe(received);
    });
  });
  describe('from original to improved', () => {
    const received = stripDiff(original, improved, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(original, improved, unexpanded)).toBe(received);
    });
  });
});

describe('props exchange values', () => {
  // Regress scenario: prop values mixed up after data source changes
  // Example of unintuitive way that diff matches opening and closing quotes.
  // If separated by unchanged prop, the changed lines are not adjacent.
  const text = 'Complete and easy to set-up JavaScript testing solution.';
  const title = 'Easy Setup';
  const correct = createElement('Item', {
    text,
    title,
  });
  const incorrect = createElement('Item', {
    text: title,
    title: text,
  });

  describe('from correct to incorrect', () => {
    const received = stripDiff(correct, incorrect, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(correct, incorrect, unexpanded)).toBe(received);
    });
  });
  describe('from incorrect to correct', () => {
    const received = stripDiff(incorrect, correct, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(incorrect, correct, unexpanded)).toBe(received);
    });
  });
});

describe('breaks in React prop value', () => {
  // Hypothetical scenario: either optimize or limit line length,
  // but mainly stress-test algorithm to align diffs :)
  // Highlight space at beginning of lines because odd leading spaces
  // not from diff algorithm.
  const id = 'J';
  const less = createElement('polyline', {
    id,
    points: '0.5,0.460 0.5,0.875 0.25,0.875',
  });
  const more = createElement('polyline', {
    id,
    points: '0.5,0.460\n 0.5,0.875\n 0.25,0.875',
  });

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('breaks versus spaces in React prop value', () => {
  // Progress scenario: limit precision in SVG coordinates [from more to less]
  const id = 'J';
  const less = createElement('polyline', {
    id,
    points: '0.5,0.460 0.5,0.875 0.25,0.875',
  });
  const more = createElement('polyline', {
    id,
    points: '0.5,0.4603174603174603\n0.5,0.875\n0.25,0.875',
  });

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('breaks within line in React start tag', () => {
  // Progress scenario: add props [from less to more]
  // No highlight because no changed line has BOTH changed and unchanged strings.
  const text = 'when';
  const less = createElement('th', null, text);
  const more = createElement(
    'th',
    {
      onClick: () => {},
      scope: 'col',
    },
    text,
  );

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('semantic cleanup helps in React text node', () => {
  // Progress scenario: render sibling element and also edit text
  const less = createElement('h2', null, 'Painless Javascript Testing');
  const more = createElement(
    'header',
    null,
    createElement('h1', null, 'Jest'),
    createElement('h2', null, 'Delightful JavaScript Testing'),
  );

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('semantic cleanup hurts with strings and breaks within line', () => {
  // Progress scenario: CSS-in-JS style prop changes
  // Without cleanup, many small diff items, but highlighting looks intuitive.
  const less = {
    background: '#99424F url("jest.svg") no-repeat',
  };
  const more = {
    backgroundColor: '#99424F',
    backgroundImage: 'url("jest.svg")',
    backgroundRepeat: 'no-repeat',
  };

  describe('from less to more', () => {
    const received = stripDiff(less, more, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(less, more, unexpanded)).toBe(received);
    });
  });
  describe('from more to less', () => {
    const received = stripDiff(more, less, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(more, less, unexpanded)).toBe(received);
    });
  });
});

describe('content changes completely', () => {
  // Regress scenario: internationalization failed
  // Progress scenario: lorem ipsum replaced by realistic content
  // Antoine de Saint Exupéry:
  const correct = createElement(
    'p',
    {lang: 'fr'},
    "Il semble que la perfection soit atteinte non quand il n'y a plus rien à ajouter, mais quand il n'y a plus rien à retrancher.",
  );
  const incorrect = createElement(
    'p',
    null,
    'It seems that perfection is attained not when there is nothing more to add, but when there is nothing more to remove.',
  );

  describe('from correct to incorrect', () => {
    const received = stripDiff(correct, incorrect, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(correct, incorrect, unexpanded)).toBe(received);
    });
  });
  describe('from incorrect to correct', () => {
    const received = stripDiff(incorrect, correct, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(incorrect, correct, unexpanded)).toBe(received);
    });
  });
});

describe('line is empty or has only space', () => {
  // Progress scenario: content changes incrementally
  const number = 273.15;
  const text = ' is the freezing point of water';
  const empty = createElement(
    'p',
    null,
    createElement(
      'span',
      null,
      number,
      '',
      createElement('abbr', {title: 'Kelvin'}, '°K'),
    ),
    text,
  );
  const space = createElement(
    'p',
    null,
    createElement(
      'span',
      null,
      number,
      ' ',
      createElement('abbr', {title: 'Kelvin'}, 'K'),
    ),
    text,
  );

  describe('from empty to space', () => {
    const received = stripDiff(empty, space, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(empty, space, unexpanded)).toBe(received);
    });
  });
  describe('from space to empty', () => {
    const received = stripDiff(space, empty, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(space, empty, unexpanded)).toBe(received);
    });
  });
});

describe('indentation within multiline string in React pre element', () => {
  // Progress scenario: documentation changes
  const usage1 = 'node [options] [ -e script | script.js | - ] [arguments]';
  const usage2 = 'node inspect script.js [arguments]';
  const even = createElement(
    'pre',
    null,
    ['Usage:', '  ' + usage1, '  ' + usage2].join('\n'),
  );
  const odd = createElement(
    'pre',
    null,
    ['Usage: ' + usage1, '       ' + usage2].join('\n'),
  );

  describe('from even to odd', () => {
    const received = stripDiff(even, odd, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(even, odd, unexpanded)).toBe(received);
    });
  });
  describe('from odd to even', () => {
    const received = stripDiff(odd, even, expanded);
    test('(expanded)', () => {
      expect(received).toMatchSnapshot();
    });
    test('(unexpanded)', () => {
      expect(stripDiff(odd, even, unexpanded)).toBe(received);
    });
  });
});
