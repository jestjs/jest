/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {plugins as builtinPlugins, format} from 'pretty-format';
import {dedentLines} from '../dedentLines';

const $$typeof = Symbol.for('react.test.json');
const plugins = [builtinPlugins.ReactTestComponent];

const formatLines2 = (val: unknown) =>
  format(val, {indent: 2, plugins}).split('\n');
const formatLines0 = (val: unknown) =>
  format(val, {indent: 0, plugins}).split('\n');

describe('dedentLines non-null', () => {
  test('no lines', () => {
    const indented: Array<string> = [];
    const dedented = indented;

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('one line empty string', () => {
    const indented = [''];
    const dedented = indented;

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('one line empty object', () => {
    const val = {};
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('one line self-closing element', () => {
    const val = {
      $$typeof,
      children: null,
      type: 'br',
    };
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('object value empty string', () => {
    const val = {
      key: '',
    };
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('object value string includes double-quote marks', () => {
    const val = {
      key: '"Always bet on JavaScript",',
    };
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('markup with props and text', () => {
    const val = {
      $$typeof,
      children: [
        {
          $$typeof,
          props: {
            alt: 'Jest logo',
            src: 'jest.svg',
          },
          type: 'img',
        },
        {
          $$typeof,
          children: ['Delightful JavaScript testing'],
          type: 'h2',
        },
      ],
      type: 'header',
    };
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });

  test('markup with components as props', () => {
    // https://daveceddia.com/pluggable-slots-in-react-components/
    const val = {
      $$typeof,
      children: null,
      props: {
        content: {
          $$typeof,
          children: ['main content here'],
          type: 'Content',
        },
        sidebar: {
          $$typeof,
          children: null,
          props: {
            user: '0123456789abcdef',
          },
          type: 'UserStats',
        },
      },
      type: 'Body',
    };
    const indented = formatLines2(val);
    const dedented = formatLines0(val);

    expect(dedentLines(indented)).toEqual(dedented);
  });
});

describe('dedentLines null', () => {
  test.each([
    ['object key multi-line', {'multi\nline\nkey': false}],
    ['object value multi-line', {key: 'multi\nline\nvalue'}],
    ['object key and value multi-line', {'multi\nline': '\nleading nl'}],
  ])('%s', (_name, val) => {
    expect(dedentLines(formatLines2(val))).toBeNull();
  });

  test('markup prop multi-line', () => {
    const val = {
      $$typeof,
      children: null,
      props: {
        alt: 'trailing newline\n',
        src: 'jest.svg',
      },
      type: 'img',
    };
    const indented = formatLines2(val);

    expect(dedentLines(indented)).toBeNull();
  });

  test('markup prop component with multi-line text', () => {
    // https://daveceddia.com/pluggable-slots-in-react-components/
    const val = {
      $$typeof,
      children: [
        {
          $$typeof,
          children: null,
          props: {
            content: {
              $$typeof,
              children: ['\n'],
              type: 'Content',
            },
            sidebar: {
              $$typeof,
              children: null,
              props: {
                user: '0123456789abcdef',
              },
              type: 'UserStats',
            },
          },
          type: 'Body',
        },
      ],
      type: 'main',
    };
    const indented = formatLines2(val);

    expect(dedentLines(indented)).toBeNull();
  });

  test('markup text multi-line', () => {
    const text = [
      'for (key in foo) {',
      '  if (Object.prototype.hasOwnProperty.call(foo, key)) {',
      '    doSomething(key);',
      '  }',
      '}',
    ].join('\n');
    const val = {
      $$typeof,
      children: [
        {
          $$typeof,
          children: [text],
          props: {
            className: 'language-js',
          },
          type: 'pre',
        },
      ],
      type: 'div',
    };
    const indented = formatLines2(val);

    expect(dedentLines(indented)).toBeNull();
  });

  test('markup text multiple lines', () => {
    const lines = [
      'for (key in foo) {',
      '  if (Object.prototype.hasOwnProperty.call(foo, key)) {',
      '    doSomething(key);',
      '  }',
      '}',
    ];
    const val = {
      $$typeof,
      children: [
        {
          $$typeof,
          children: lines,
          props: {
            className: 'language-js',
          },
          type: 'pre',
        },
      ],
      type: 'div',
    };
    const indented = formatLines2(val);

    expect(dedentLines(indented)).toBeNull();
  });

  test('markup unclosed self-closing start tag', () => {
    const indented = ['<img', '  alt="Jest logo"', '  src="jest.svg"'];

    expect(dedentLines(indented)).toBeNull();
  });

  test('markup unclosed because no end tag', () => {
    const indented = ['<p>', '  Delightful JavaScript testing'];

    expect(dedentLines(indented)).toBeNull();
  });
});
