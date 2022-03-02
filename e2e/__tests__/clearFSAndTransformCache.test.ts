import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(tmpdir(), 'clear_FS_and_transform_cache');
const testFileContent = `
'use strict';

const fs = require('fs');
const path = require('path');

const absoluteTestHelperFile = path.resolve(__dirname, './testHelper.js');

test('value is 1', () => {
  const value = require('./testHelper');
  expect(value).toBe(1);
});

test('value is 1 after file is changed', () => {
  fs.writeFileSync(absoluteTestHelperFile, 'module.exports = 2;');
  const value = require('./testHelper');
  expect(value).toBe(1);
});

test('value is 2 after calling "jest.resetModules"', () => {
  jest.resetModules();
  const value = require('./testHelper');
  expect(value).toBe(2);
});
`;

beforeAll(() => cleanup(dir));
afterEach(() => cleanup(dir));

test('clear FS and transform cache', () => {
  writeFiles(dir, {
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
    'test.js': testFileContent,
    'testHelper.js': 'module.exports = 1;',
  });
  const {exitCode} = runJest(dir);
  expect(exitCode).toBe(0);
});
