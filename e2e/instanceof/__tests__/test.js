/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const http = require('http');
const url = require('url');

test('arrays returned by Node APIs use the test realm Array constructor', () => {
  const {query} = url.parse('https://jestjs.io/?tag=node&tag=vm', true);

  expect(query.tag).toBeInstanceOf(Array);
});

test('errors thrown by Node APIs use the test realm Error constructor', () => {
  expect.hasAssertions();

  try {
    fs.readFileSync('this-file-does-not-exist');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});

test('errors thrown by Node APIs do not match unrelated subclasses', () => {
  class CustomError extends Error {}

  expect.hasAssertions();

  try {
    fs.readFileSync('this-file-does-not-exist');
  } catch (error) {
    expect(error).not.toBeInstanceOf(CustomError);
  }
});

test('Object.getPrototypeOf maps Node fetch results to the test realm', async () => {
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ok: true}));
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    const {port} = server.address();
    const response = await fetch(`http://127.0.0.1:${port}`);
    const json = await response.json();

    expect(Object.getPrototypeOf(json)).toBe(Object.prototype);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
});
