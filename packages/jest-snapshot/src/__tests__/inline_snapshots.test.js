/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('fs');
jest.mock('prettier');

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const {saveInlineSnapshots} = require('../inline_snapshots');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;
const existsSync = fs.existsSync;
const statSync = fs.statSync;
const readdirSync = fs.readdirSync;
beforeEach(() => {
  fs.writeFileSync = jest.fn();
  fs.readFileSync = jest.fn();
  fs.existsSync = jest.fn(() => true);
  fs.statSync = jest.fn(filePath => ({
    isDirectory: () => !filePath.endsWith('.js'),
  }));
  fs.readdirSync = jest.fn(() => []);

  prettier.resolveConfig.sync.mockReset();
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
  fs.readFileSync = jest.fn(() => `expect(1).toMatchInlineSnapshot();\n`);

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1},
        snapshot: `1`,
      },
    ],
    prettier,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot(`1`);\n',
  );
});

test.each([['babylon'], ['flow'], ['typescript']])(
  'saveInlineSnapshots() replaces existing template literal - %s parser',
  parser => {
    const filename = path.join(__dirname, 'my.test.js');
    fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot(`2`);\n');

    prettier.resolveConfig.sync.mockReturnValue({parser});

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1},
          snapshot: `1`,
        },
      ],
      prettier,
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
  fs.readFileSync = jest.fn(
    () => 'expect(1).toMatchInlineSnapshot({}, `2`);\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1},
        snapshot: `1`,
      },
    ],
    prettier,
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot({}, `1`);\n',
  );
});

test('saveInlineSnapshots() throws if frame does not match', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot();\n');

  const save = () =>
    saveInlineSnapshots(
      [
        {
          frame: {column: 2 /* incorrect */, file: filename, line: 1},
          snapshot: `1`,
        },
      ],
      prettier,
    );

  expect(save).toThrowError(/Couldn't locate all inline snapshots./);
});

test('saveInlineSnapshots() throws if multiple calls to to the same location', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot();\n');

  const frame = {column: 11, file: filename, line: 1};
  const save = () =>
    saveInlineSnapshots(
      [{frame, snapshot: `1`}, {frame, snapshot: `2`}],
      prettier,
    );

  expect(save).toThrowError(
    /Multiple inline snapshots for the same call are not supported./,
  );
});

test('saveInlineSnapshots() uses escaped backticks', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect("`").toMatchInlineSnapshot();\n');

  const frame = {column: 13, file: filename, line: 1};
  saveInlineSnapshots([{frame, snapshot: '`'}], prettier);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect("`").toMatchInlineSnapshot(`\\``);\n',
  );
});
