/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const React = require('react');
const renderer = require('react-test-renderer');

const prettyFormat = require('../');
const ReactTestComponent = require('../plugins/react_test_component');
const ReactElement = require('../plugins/react_element');

function assertPrintedJSX(actual, expected, opts) {
  expect(
    prettyFormat(
      actual,
      Object.assign(
        {
          plugins: [ReactElement],
        },
        opts,
      ),
    ),
  ).toEqual(expected);
  expect(
    prettyFormat(
      renderer.create(actual).toJSON(),
      Object.assign(
        {
          plugins: [ReactTestComponent, ReactElement],
        },
        opts,
      ),
    ),
  ).toEqual(expected);
}

test('supports a single element with no props or children', () => {
  assertPrintedJSX(React.createElement('Mouse'), '<Mouse />');
});

test('supports a single element with no props', () => {
  assertPrintedJSX(
    React.createElement('Mouse', null, 'Hello World'),
    '<Mouse>\n  Hello World\n</Mouse>',
  );
});

test('supports a single element with number children', () => {
  assertPrintedJSX(
    React.createElement('Mouse', null, 4),
    '<Mouse>\n  4\n</Mouse>',
  );
});

test('supports a single element with mixed children', () => {
  assertPrintedJSX(
    React.createElement('Mouse', null, [[1, null], 2, undefined, [false, [3]]]),
    '<Mouse>\n  1\n  2\n  3\n</Mouse>',
  );
});

test('supports props with strings', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {style: 'color:red'}),
    '<Mouse\n  style="color:red"\n/>',
  );
});

test('supports props with numbers', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {size: 5}),
    '<Mouse\n  size={5}\n/>',
  );
});

test('supports a single element with a function prop', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {onclick: function onclick() {}}),
    '<Mouse\n  onclick={[Function onclick]}\n/>',
  );
});

test('supports a single element with a object prop', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {customProp: {one: '1', two: 2}}),
    '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n/>',
  );
});

test('supports an element with and object prop and children', () => {
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      {customProp: {one: '1', two: 2}},
      React.createElement('Mouse'),
    ),
    '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n>\n  <Mouse />\n</Mouse>',
  );
});

test('supports an element with complex props and mixed children', () => {
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
      'HELLO',
      React.createElement('Mouse'),
      'CIAO',
    ),
    '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  onclick={[Function onclick]}\n>\n  HELLO\n  <Mouse />\n  CIAO\n</Mouse>',
  );
});

test('escapes children properly', () => {
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      null,
      '"-"',
      React.createElement('Mouse'),
      '\\ \\\\',
    ),
    '<Mouse>\n  "-"\n  <Mouse />\n  \\ \\\\\n</Mouse>',
  );
});

test('supports everything all together', () => {
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
      'HELLO',
      React.createElement(
        'Mouse',
        {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
        'HELLO',
        React.createElement('Mouse'),
        'CIAO',
      ),
      'CIAO',
    ),
    '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  onclick={[Function onclick]}\n>\n  HELLO\n  <Mouse\n    customProp={\n      Object {\n        "one": "1",\n        "two": 2,\n      }\n    }\n    onclick={[Function onclick]}\n  >\n    HELLO\n    <Mouse />\n    CIAO\n  </Mouse>\n  CIAO\n</Mouse>',
  );
});

test('sorts props in nested components', () => {
  /* eslint-disable sort-keys */
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      {
        zeus: 'kentaromiura watched me fix this',
        abc: {
          one: '1',
          two: 2,
        },
      },
      React.createElement(
        'Mouse',
        {
          xyz: 123,
          acbd: {
            one: '1',
            two: 2,
          },
        },
        'NESTED',
      ),
    ),
    '<Mouse\n  abc={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  zeus="kentaromiura watched me fix this"\n>\n  <Mouse\n    acbd={\n      Object {\n        "one": "1",\n        "two": 2,\n      }\n    }\n    xyz={123}\n  >\n    NESTED\n  </Mouse>\n</Mouse>',
  );
  /* eslint-enable sort-keys */
});

test('supports a single element with React elements as props', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement('div'),
    }),
    '<Mouse\n  prop={<div />}\n/>',
  );
});

test('supports a single element with React elements with props', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement('div', {foo: 'bar'}),
    }),
    '<Mouse\n  prop={\n    <div\n      foo="bar"\n    />\n  }\n/>',
  );
});

test('supports a single element with custom React elements with props', () => {
  function Cat() {
    return React.createElement('div');
  }
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement(Cat, {foo: 'bar'}),
    }),
    '<Mouse\n  prop={\n    <Cat\n      foo="bar"\n    />\n  }\n/>',
  );
});

test('supports a single element with custom React elements with props (using displayName)', () => {
  function Cat() {
    return React.createElement('div');
  }
  Cat.displayName = 'CatDisplayName';
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement(Cat, {foo: 'bar'}),
    }),
    '<Mouse\n  prop={\n    <CatDisplayName\n      foo="bar"\n    />\n  }\n/>',
  );
});

test('supports a single element with custom React elements with props (using anonymous function)', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement(
        () => {
          React.createElement('div');
        },
        {foo: 'bar'},
      ),
    }),
    '<Mouse\n  prop={\n    <Unknown\n      foo="bar"\n    />\n  }\n/>',
  );
});

test('supports a single element with custom React elements with a child', () => {
  function Cat(props) {
    return React.createElement('div', props);
  }
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement(Cat, {}, React.createElement('div')),
    }),
    '<Mouse\n  prop={\n    <Cat>\n      <div />\n    </Cat>\n  }\n/>',
  );
});

test('supports Unknown element', () => {
  // Suppress React.createElement(undefined) console error
  const consoleError = console.error;
  console.error = jest.fn();
  expect(
    prettyFormat(React.createElement(undefined), {
      plugins: [ReactElement],
    }),
  ).toEqual('<Unknown />');
  console.error = consoleError;
});

test('supports a single element with React elements with a child', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement('div', null, 'mouse'),
    }),
    '<Mouse\n  prop={\n    <div>\n      mouse\n    </div>\n  }\n/>',
  );
});

test('supports a single element with React elements with children', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement(
        'div',
        null,
        'mouse',
        React.createElement('span', null, 'rat'),
      ),
    }),
    '<Mouse\n  prop={\n    <div>\n      mouse\n      <span>\n        rat\n      </span>\n    </div>\n  }\n/>',
  );
});

test('supports a single element with React elements with array children', () => {
  assertPrintedJSX(
    React.createElement('Mouse', {
      prop: React.createElement('div', null, 'mouse', [
        React.createElement('span', {key: 1}, 'rat'),
        React.createElement('span', {key: 2}, 'cat'),
      ]),
    }),
    '<Mouse\n  prop={\n    <div>\n      mouse\n      <span>\n        rat\n      </span>\n      <span>\n        cat\n      </span>\n    </div>\n  }\n/>',
  );
});

test('uses the supplied line seperator for min mode', () => {
  assertPrintedJSX(
    React.createElement(
      'Mouse',
      {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
      'HELLO',
      React.createElement(
        'Mouse',
        {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
        'HELLO',
        React.createElement('Mouse'),
        'CIAO',
      ),
      'CIAO',
    ),
    '<Mouse customProp={{"one": "1", "two": 2}} onclick={[Function onclick]}>HELLO<Mouse customProp={{"one": "1", "two": 2}} onclick={[Function onclick]}>HELLO<Mouse />CIAO</Mouse>CIAO</Mouse>',
    {min: true},
  );
});

test('ReactElement plugin highlights syntax', () => {
  const jsx = React.createElement('Mouse', {
    prop: React.createElement(
      'div',
      null,
      'mouse',
      React.createElement('span', null, 'rat'),
    ),
  });
  expect(
    prettyFormat(jsx, {
      highlight: true,
      plugins: [ReactElement],
    }),
  ).toMatchSnapshot();
});

test('ReactTestComponent plugin highlights syntax', () => {
  const jsx = React.createElement('Mouse', {
    prop: React.createElement(
      'div',
      null,
      'mouse',
      React.createElement('span', null, 'rat'),
    ),
  });
  expect(
    prettyFormat(renderer.create(jsx).toJSON(), {
      highlight: true,
      plugins: [ReactTestComponent, ReactElement],
    }),
  ).toMatchSnapshot();
});

test('throws if theme option is null', () => {
  const jsx = React.createElement(
    'Mouse',
    {style: 'color:red'},
    'Hello, Mouse!',
  );
  expect(() => {
    prettyFormat(jsx, {
      highlight: true,
      plugins: [ReactElement],
      theme: null,
    });
  }).toThrow('pretty-format: Option "theme" must not be null.');
});

test('throws if theme option is not of type "object"', () => {
  expect(() => {
    const jsx = React.createElement(
      'Mouse',
      {style: 'color:red'},
      'Hello, Mouse!',
    );
    prettyFormat(jsx, {
      highlight: true,
      plugins: [ReactElement],
      theme: 'beautiful',
    });
  }).toThrow(
    'pretty-format: Option "theme" must be of type "object" but instead received "string".',
  );
});

test('throws if theme option has value that is undefined in ansi-styles', () => {
  expect(() => {
    const jsx = React.createElement(
      'Mouse',
      {style: 'color:red'},
      'Hello, Mouse!',
    );
    prettyFormat(jsx, {
      highlight: true,
      plugins: [ReactElement],
      theme: {
        content: 'unknown',
        prop: 'yellow',
        tag: 'cyan',
        value: 'green',
      },
    });
  }).toThrow(
    'pretty-format: Option "theme" has a key "content" whose value "unknown" is undefined in ansi-styles.',
  );
});

test('ReactElement plugin highlights syntax with color from theme option', () => {
  const jsx = React.createElement(
    'Mouse',
    {style: 'color:red'},
    'Hello, Mouse!',
  );
  expect(
    prettyFormat(jsx, {
      highlight: true,
      plugins: [ReactElement],
      theme: {
        value: 'red',
      },
    }),
  ).toMatchSnapshot();
});

test('ReactTestComponent plugin highlights syntax with color from theme option', () => {
  const jsx = React.createElement(
    'Mouse',
    {style: 'color:red'},
    'Hello, Mouse!',
  );
  expect(
    prettyFormat(renderer.create(jsx).toJSON(), {
      highlight: true,
      plugins: [ReactTestComponent, ReactElement],
      theme: {
        value: 'red',
      },
    }),
  ).toMatchSnapshot();
});
