/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat, {plugins} from '../';
const {ReactElement, ReactTestComponent} = plugins;

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const formatElement = (element: unknown) =>
  prettyFormat(element, {plugins: [ReactElement]});

const formatTestObject = (object: unknown) =>
  prettyFormat(object, {plugins: [ReactTestComponent, ReactElement]});

describe.each([
  ['React 17', 'react-17', 'react-test-renderer-17'],
  ['React 18', 'react-18', 'react-test-renderer-18'],
  ['React 19', 'react-19', 'react-test-renderer-19'],
])('%s', (_name, reactPackage, rendererPackage) => {
  const React = require(reactPackage) as typeof import('react');

  // The renderer reaches into React's shared internals, so it only works
  // against the matching React copy rather than the hoisted one.
  const renderToJSON = (
    createElement: (React: typeof import('react')) => React.ReactElement,
  ) => {
    let json: unknown;
    jest.isolateModules(() => {
      jest.doMock('react', () => require(reactPackage));
      const isolatedReact = require(reactPackage) as typeof import('react');
      const TestRenderer = require(
        rendererPackage,
      ) as typeof import('react-test-renderer');
      let testRenderer: import('react-test-renderer').ReactTestRenderer;
      TestRenderer.act(() => {
        testRenderer = TestRenderer.create(createElement(isolatedReact));
      });
      json = testRenderer!.toJSON();
    });
    return json;
  };

  test('fragment', () => {
    expect(
      formatElement(
        React.createElement(
          React.Fragment,
          null,
          React.createElement('div', {className: 'foo'}, 'hello'),
        ),
      ),
    ).toMatchSnapshot();
  });

  test('host element', () => {
    expect(
      formatElement(
        React.createElement(
          'div',
          null,
          React.createElement('span', {className: 'bar'}, 'world'),
        ),
      ),
    ).toMatchSnapshot();
  });

  test('suspense', () => {
    expect(
      formatElement(
        React.createElement(
          React.Suspense,
          {fallback: React.createElement('span', null, 'loading')},
          React.createElement('div', null, 'content'),
        ),
      ),
    ).toMatchSnapshot();
  });

  test('forwardRef', () => {
    function Cat(props: Record<string, unknown>, _ref: unknown) {
      return React.createElement('div', props);
    }
    expect(
      formatElement(React.createElement(React.forwardRef(Cat), null, 'mouse')),
    ).toMatchSnapshot();
  });

  test('memo', () => {
    function Dog(props: Record<string, unknown>) {
      return React.createElement('div', props);
    }
    expect(
      formatElement(React.createElement(React.memo(Dog), null, 'cat')),
    ).toMatchSnapshot();
  });

  test('context provider', () => {
    const {Provider} = React.createContext('test');
    expect(
      formatElement(
        React.createElement(Provider, {value: 'test-value'}, 'child'),
      ),
    ).toMatchSnapshot();
  });

  test('context consumer', () => {
    const {Consumer} = React.createContext('test');
    expect(
      formatElement(
        React.createElement(Consumer, {
          children: () => React.createElement('div', null, 'child'),
        }),
      ),
    ).toMatchSnapshot();
  });

  test('test object for host element', () => {
    expect(
      formatTestObject(
        renderToJSON(React =>
          React.createElement(
            'div',
            {className: 'foo'},
            React.createElement('span', null, 'hello'),
          ),
        ),
      ),
    ).toMatchSnapshot();
  });

  test('test object for fragment', () => {
    expect(
      formatTestObject(
        renderToJSON(React =>
          React.createElement(
            React.Fragment,
            null,
            React.createElement('div', null, 'one'),
            React.createElement('div', null, 'two'),
          ),
        ),
      ),
    ).toMatchSnapshot();
  });

  test('test object for composite element', () => {
    expect(
      formatTestObject(
        renderToJSON(React => {
          function Cat({name}: {name: string}) {
            return React.createElement('div', {id: 'cat'}, name);
          }
          return React.createElement(Cat, {name: 'Tom'});
        }),
      ),
    ).toMatchSnapshot();
  });
});
