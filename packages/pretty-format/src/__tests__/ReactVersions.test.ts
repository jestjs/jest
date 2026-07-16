/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat, {plugins} from '../';
const {ReactElement} = plugins;

const formatElement = (element: unknown) =>
  prettyFormat(element, {plugins: [ReactElement]});

describe.each([
  ['React 17', require('react-17') as typeof import('react')],
  ['React 18', require('react-18') as typeof import('react')],
  ['React 19', require('react-19') as typeof import('react')],
])('%s', (_name, React) => {
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
});
