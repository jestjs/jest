/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

jest.mock('fs');
jest.mock('prettier');

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const babelTraverse = require('@babel/traverse').default;

const {saveInlineSnapshots} = require('../inline_snapshots');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;
const existsSync = fs.existsSync;
const statSync = fs.statSync;
const readdirSync = fs.readdirSync;
beforeEach(() => {
  // $FlowFixMe mock
  fs.writeFileSync = jest.fn();
  // $FlowFixMe mock
  fs.readFileSync = jest.fn();
  // $FlowFixMe mock
  fs.existsSync = jest.fn(() => true);
  // $FlowFixMe mock
  fs.statSync = jest.fn(filePath => ({
    isDirectory: () => !filePath.endsWith('.js'),
  }));
  // $FlowFixMe mock
  fs.readdirSync = jest.fn(() => []);

  prettier.resolveConfig.sync.mockReset();
});
afterEach(() => {
  // $FlowFixMe mock
  fs.writeFileSync = writeFileSync;
  // $FlowFixMe mock
  fs.readFileSync = readFileSync;
  // $FlowFixMe mock
  fs.existsSync = existsSync;
  // $FlowFixMe mock
  fs.statSync = statSync;
  // $FlowFixMe mock
  fs.readdirSync = readdirSync;
});

test('saveInlineSnapshots() replaces empty function call with a template literal', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => `expect(1).toMatchInlineSnapshot();\n`,
  ): any);

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1},
        snapshot: `1`,
      },
    ],
    prettier,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot(`1`);\n',
  );
});

test('saveInlineSnapshots() without prettier leaves formatting outside of snapshots alone', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  ): any);

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: { column: 11, file: filename, line },
      snapshot: `[1, 2]`
    })),
    null,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`,
  );
});

test('saveInlineSnapshots() can handle typescript without prettier', () => {
  const filename = path.join(__dirname, 'my.test.ts');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => `
interface Foo {
  foo: string
}
const a: [Foo, Foo] = [{ foo: 'one' },            { foo: 'two' }];
expect(a).toMatchInlineSnapshot();
`.trim() + '\n',
  ): any);

  saveInlineSnapshots(
    [{
      frame: { column: 11, file: filename, line: 5 },
      snapshot: `[{ foo: 'one' }, { foo: 'two' }]`
    }],
    null,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `
interface Foo {
  foo: string
}
const a: [Foo, Foo] = [{ foo: 'one' },            { foo: 'two' }];
expect(a).toMatchInlineSnapshot(\`[{ foo: 'one' }, { foo: 'two' }]\`);
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can use prettier to fix formatting for whole file', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  ): any);

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: { column: 11, file: filename, line },
      snapshot: `[1, 2]`
    })),
    prettier,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `const a = [1, 2];
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`,
  );
});

test.each([['babylon'], ['flow'], ['typescript']])(
  'saveInlineSnapshots() replaces existing template literal - %s parser',
  parser => {
    const filename = path.join(__dirname, 'my.test.js');
    // $FlowFixMe mock
    fs.readFileSync = (jest.fn(
      () => 'expect(1).toMatchInlineSnapshot(`2`);\n',
    ): any);

    prettier.resolveConfig.sync.mockReturnValue({parser});

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1},
          snapshot: `1`,
        },
      ],
      prettier,
      babelTraverse,
    );

    expect(prettier.resolveConfig.sync.mock.results[0].value).toEqual({parser});

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filename,
      'expect(1).toMatchInlineSnapshot(`1`);\n',
    );
  },
);

test('saveInlineSnapshots() replaces existing template literal with property matchers', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => 'expect(1).toMatchInlineSnapshot({}, `2`);\n',
  ): any);

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1},
        snapshot: `1`,
      },
    ],
    prettier,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot({}, `1`);\n',
  );
});

test('saveInlineSnapshots() creates template literal with property matchers', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => 'expect(1).toMatchInlineSnapshot({});\n',
  ): any);

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1},
        snapshot: `1`,
      },
    ],
    prettier,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot({}, `1`);\n',
  );
});

test('saveInlineSnapshots() throws if frame does not match', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => 'expect(1).toMatchInlineSnapshot();\n',
  ): any);

  const save = () =>
    saveInlineSnapshots(
      [
        {
          frame: {column: 2 /* incorrect */, file: filename, line: 1},
          snapshot: `1`,
        },
      ],
      prettier,
      babelTraverse,
    );

  expect(save).toThrowError(/Couldn't locate all inline snapshots./);
});

test('saveInlineSnapshots() throws if multiple calls to to the same location', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => 'expect(1).toMatchInlineSnapshot();\n',
  ): any);

  const frame = {column: 11, file: filename, line: 1};
  const save = () =>
    saveInlineSnapshots(
      [{frame, snapshot: `1`}, {frame, snapshot: `2`}],
      prettier,
      babelTraverse,
    );

  expect(save).toThrowError(
    /Multiple inline snapshots for the same call are not supported./,
  );
});

test('saveInlineSnapshots() uses escaped backticks', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => 'expect("`").toMatchInlineSnapshot();\n',
  ): any);

  const frame = {column: 13, file: filename, line: 1};
  saveInlineSnapshots([{frame, snapshot: '`'}], prettier, babelTraverse);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect("`").toMatchInlineSnapshot(`\\``);\n',
  );
});

test('saveInlineSnapshots() works with non-literals in expect call', () => {
  const filename = path.join(__dirname, 'my.test.js');
  // $FlowFixMe mock
  fs.readFileSync = (jest.fn(
    () => `expect({a: 'a'}).toMatchInlineSnapshot();\n`,
  ): any);
  prettier.resolveConfig.sync.mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 18, file: filename, line: 1},
        snapshot: `{a: 'a'}`,
      },
    ],
    prettier,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    "expect({a: 'a'}).toMatchInlineSnapshot(`{a: 'a'}`);\n",
  );
});
