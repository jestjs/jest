/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('fs');
jest.mock('prettier');
jest.mock('@babel/core');

import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import babelTraverse from '@babel/traverse';
import * as babelCore from '@babel/core';
import {Frame} from 'jest-message-util';

import {saveInlineSnapshots} from '../inline_snapshots';

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;
const existsSync = fs.existsSync;
const statSync = fs.statSync;
const readdirSync = fs.readdirSync;
beforeEach(() => {
  fs.writeFileSync = jest.fn();
  fs.readFileSync = jest.fn();
  fs.existsSync = jest.fn(() => true);
  (fs.statSync as jest.Mock).mockImplementation(filePath => ({
    isDirectory: () => !filePath.endsWith('.js'),
  }));
  fs.readdirSync = jest.fn(() => []);

  jest
    .spyOn(babelCore, 'loadPartialConfig')
    .mockImplementation(() => ({options: {plugins: []}}));

  (prettier.resolveConfig.sync as jest.Mock).mockReset();
});
afterEach(() => {
  fs.writeFileSync = writeFileSync;
  fs.readFileSync = readFileSync;
  fs.existsSync = existsSync;
  fs.statSync = statSync;
  fs.readdirSync = readdirSync;
});

test('saveInlineSnapshots() replaces empty function call with a template literal', () => {
  const filename = path.join(__dirname, 'my.test.js');
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => `expect(1).toMatchInlineSnapshot();\n`,
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1} as Frame,
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
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () =>
      `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: {column: 11, file: filename, line} as Frame,
      snapshot: `[1, 2]`,
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
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () =>
      `
interface Foo {
  foo: string
}
const a: [Foo, Foo] = [{ foo: 'one' },            { foo: 'two' }];
expect(a).toMatchInlineSnapshot();
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 5} as Frame,
        snapshot: `[{ foo: 'one' }, { foo: 'two' }]`,
      },
    ],
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

test('saveInlineSnapshots() can handle tsx without prettier', () => {
  const filename = path.join(__dirname, 'my.test.tsx');
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () =>
      `
it('foos', async () => {
  const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
  const a = await Foo({ foo: "hello" });
  expect(a).toMatchInlineSnapshot();
})
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 13, file: filename, line: 4} as Frame,
        snapshot: `<div>hello</div>`,
      },
    ],
    null,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `
it('foos', async () => {
  const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
  const a = await Foo({ foo: "hello" });
  expect(a).toMatchInlineSnapshot(\`<div>hello</div>\`);
})
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can handle flow and jsx without prettier', () => {
  jest.spyOn(babelCore, 'loadPartialConfig').mockImplementation(() => ({
    options: {
      plugins: ['flow', 'jsx'],
    },
  }));
  const filename = path.join(__dirname, 'my.test.js');
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () =>
      `
const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
const a = Foo({ foo: "hello" });
expect(a).toMatchInlineSnapshot();
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 3} as Frame,
        snapshot: `<div>hello</div>`,
      },
    ],
    null,
    babelTraverse,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `
const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
const a = Foo({ foo: "hello" });
expect(a).toMatchInlineSnapshot(\`<div>hello</div>\`);
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can use prettier to fix formatting for whole file', () => {
  const filename = path.join(__dirname, 'my.test.js');
  jest.spyOn(fs, 'readFileSync').mockImplementation(
    () =>
      `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: {column: 11, file: filename, line} as Frame,
      snapshot: `[1, 2]`,
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
    (fs.readFileSync as jest.Mock).mockImplementation(
      () => 'expect(1).toMatchInlineSnapshot(`2`);\n',
    );

    (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({parser});

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1} as Frame,
          snapshot: `1`,
        },
      ],
      prettier,
      babelTraverse,
    );

    expect(
      (prettier.resolveConfig.sync as jest.Mock).mock.results[0].value,
    ).toEqual({parser});

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filename,
      'expect(1).toMatchInlineSnapshot(`1`);\n',
    );
  },
);

test('saveInlineSnapshots() replaces existing template literal with property matchers', () => {
  const filename = path.join(__dirname, 'my.test.js');
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => 'expect(1).toMatchInlineSnapshot({}, `2`);\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1} as Frame,
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

test.each([prettier, null])(
  'saveInlineSnapshots() creates template literal with property matchers',
  prettierModule => {
    const filename = path.join(__dirname, 'my.test.js');
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(() => 'expect(1).toMatchInlineSnapshot({});\n');

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1} as Frame,
          snapshot: `1`,
        },
      ],
      prettierModule,
      babelTraverse,
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filename,
      'expect(1).toMatchInlineSnapshot({}, `1`);\n',
    );
  },
);

test('saveInlineSnapshots() throws if frame does not match', () => {
  const filename = path.join(__dirname, 'my.test.js');
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => 'expect(1).toMatchInlineSnapshot();\n',
  );

  const save = () =>
    saveInlineSnapshots(
      [
        {
          frame: {column: 2 /* incorrect */, file: filename, line: 1} as Frame,
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
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => 'expect(1).toMatchInlineSnapshot();\n',
  );

  const frame = {column: 11, file: filename, line: 1} as Frame;
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
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => 'expect("`").toMatchInlineSnapshot();\n',
  );

  const frame = {column: 13, file: filename, line: 1} as Frame;
  saveInlineSnapshots([{frame, snapshot: '`'}], prettier, babelTraverse);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect("`").toMatchInlineSnapshot(`\\``);\n',
  );
});

test('saveInlineSnapshots() works with non-literals in expect call', () => {
  const filename = path.join(__dirname, 'my.test.js');
  (fs.readFileSync as jest.Mock).mockImplementation(
    () => `expect({a: 'a'}).toMatchInlineSnapshot();\n`,
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 18, file: filename, line: 1} as Frame,
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
