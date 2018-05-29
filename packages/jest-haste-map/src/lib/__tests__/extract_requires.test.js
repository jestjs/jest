/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import extractRequires from '../extract_requires';

it('extracts both requires and imports from code', () => {
  const code = `
      import module1 from 'module1';
      const module2 = require('module2');
      import('module3').then(module3 => {})';
    `;

  expect(extractRequires(code)).toEqual(['module1', 'module2', 'module3']);
});

it('extracts requires in order', () => {
  const code = `
      const module1 = require('module1');
      const module2 = require('module2');
      const module3 = require('module3');
    `;

  expect(extractRequires(code)).toEqual(['module1', 'module2', 'module3']);
});

it('strips out comments from code', () => {
  const code = `// comment const module2 = require('module2');`;

  expect(extractRequires(code)).toEqual([]);
});

it('ignores requires in comments', () => {
  const code = [
    '// const module1 = require("module1");',
    '/**',
    ' * const module2 = require("module2");',
    ' */',
  ].join('\n');

  expect(extractRequires(code)).toEqual([]);
});

it('ignores requires in comments with Windows line endings', () => {
  const code = [
    '// const module1 = require("module1");',
    '/**',
    ' * const module2 = require("module2");',
    ' */',
  ].join('\r\n');

  expect(extractRequires(code)).toEqual([]);
});

it('ignores requires in comments with unicode line endings', () => {
  const code = [
    '// const module1 = require("module1");\u2028',
    '// const module1 = require("module2");\u2029',
    '/*\u2028',
    'const module2 = require("module3");\u2029',
    ' */',
  ].join('');

  expect(extractRequires(code)).toEqual([]);
});

it('does not contain duplicates', () => {
  const code = `
      const module1 = require('module1');
      const module1Dup = require('module1');
    `;

  expect(extractRequires(code)).toEqual(['module1']);
});

it('ignores type imports', () => {
  const code = [
    "import type foo from 'bar';",
    'import type {',
    '  bar,',
    '  baz,',
    "} from 'wham'",
  ].join('\r\n');

  expect(extractRequires(code)).toEqual([]);
});

it('ignores type exports', () => {
  const code = [
    'export type Foo = number;',
    'export default {}',
    "export * from 'module1'",
  ].join('\r\n');

  expect(extractRequires(code)).toEqual(['module1']);
});

it('understands require.requireActual', () => {
  const code = `require.requireActual('pizza');`;
  expect(extractRequires(code)).toEqual(['pizza']);
});

it('understands jest.requireActual', () => {
  const code = `jest.requireActual('whiskey');`;
  expect(extractRequires(code)).toEqual(['whiskey']);
});

it('understands require.requireMock', () => {
  const code = `require.requireMock('cheeseburger');`;
  expect(extractRequires(code)).toEqual(['cheeseburger']);
});

it('understands jest.requireMock', () => {
  const code = `jest.requireMock('scotch');`;
  expect(extractRequires(code)).toEqual(['scotch']);
});
