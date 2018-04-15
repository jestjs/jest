/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const fs = require('fs');

const http = require('http');

test('fs Error', () => {
  expect.hasAssertions();

  try {
    fs.readFileSync('does not exist');
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
  }
});

test('http error', done => {
  const request = http.request('http://does-not-exist/blah', res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('end', () => {
      done(new Error('Ended before failure'));
    });
  });

  request.once('error', err => {
    expect(err).toBeInstanceOf(Error);
    done();
  });
});

test('Array', () => {
  expect([]).toBeInstanceOf(Array);
});
