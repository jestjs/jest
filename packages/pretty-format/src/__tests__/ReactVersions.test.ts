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
  test('renders a simple element', () => {
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

  test('renders nested elements', () => {
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
});
