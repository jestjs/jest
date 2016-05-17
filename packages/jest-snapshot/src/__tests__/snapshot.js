/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .unmock('react');

const fs = require('fs');
const path = require('path');
let React;

describe('snapshot', () => {

  beforeEach(() => {
    React = require('react');
  });

  it('works with plain objects', () => {
    const test = {
      a: 1,
      b: '2',
      c: 'three',
    };
    expect(test).toMatchSnapshot();

    // check if the file has been created correctly
    const expectedPath = path.resolve(
      __dirname,
      './__snapshots__/',
      path.basename(__filename) + '.snap'
    );
    expect(() => fs.accessSync(expectedPath, fs.F_OK)).not.toThrow();

    // check if the snapshot has the correct key
    const snapshot = JSON.parse('' + fs.readFileSync(expectedPath));
    const prettyPrinted = (
      '{\n\u001b[90m|\u001b[39m a: 1,\n\u001b[90m|\u001b' +
      `[39m b: '2',\n\u001b[90m|\u001b[39m c: 'three'\n}`
    );
    expect(snapshot['snapshot works with plain objects 0'])
      .toBe(prettyPrinted);
  });

  it('works with react elements', () => {
    const test = React.createElement('li', null, 'Text Content');
    expect(test).toMatchSnapshot();

    // check if the file has been created correctly
    const expectedPath = path.resolve(
      __dirname,
      './__snapshots__/',
      path.basename(__filename) + '.snap'
    );
    expect(() => fs.accessSync(expectedPath, fs.F_OK)).not.toThrow();

    // check if the snapshot has the correct key
    const snapshot = JSON.parse('' + fs.readFileSync(expectedPath));
    const prettyPrinted = (
      '<li data-reactroot="" data-reactid="1"' +
      ' data-react-checksum="616174366">Text Content</li>'
    );
    expect(snapshot['snapshot works with react elements 0'])
      .toBe(prettyPrinted);
  });
});
