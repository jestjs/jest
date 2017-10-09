/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import path from 'path';
import Snapshot from '../Snapshot';

const snapshotHelper = new Snapshot();
const snapshotFixturePath = path.resolve(__dirname, 'fixtures/snapshots');

test('nodescribe.example', () => {
  const filePath = path.join(snapshotFixturePath, 'nodescribe.example');
  const results = snapshotHelper.getMetadata(filePath);
  const allAssertion = [
    'fit',
    'it',
    'it.only',
    'it.skip',
    'test',
    'test.only',
    'test.skip',
    'xit',
    'xtest',
  ];

  const expectations = Object.create(null);
  allAssertion.forEach(assertion => {
    expectations['test ' + assertion + ' 1'] = {
      assertion,
      checked: false,
      number: 1,
    };
    expectations['test ' + assertion + ' 2'] = {
      assertion,
      checked: false,
      number: 2,
    };
  });

  results.forEach(result => {
    const check = expectations[result.name];
    check.checked = result.content === `${check.assertion} ${check.number}`;
  });

  expect(
    Object.keys(expectations)
      .map(key => expectations[key])
      .filter(expectation => !expectation.checked).length,
  ).toBe(0);
});

test('describe.example', () => {
  const filePath = path.join(snapshotFixturePath, 'describe.example');
  const results = snapshotHelper.getMetadata(filePath);
  const allDescribe = [
    'describe',
    'describe.only',
    'describe.skip',
    'fdescribe',
    'xdescribe',
  ];
  const allAssertion = [
    'fit',
    'it',
    'it.only',
    'it.skip',
    'test',
    'test.only',
    'test.skip',
    'xit',
    'xtest',
  ];

  const expectations = Object.create(null);

  allDescribe.forEach(describe => {
    allAssertion.forEach(assertion => {
      expectations[describe.toUpperCase() + ' ' + assertion + ' 1'] = {
        assertion,
        checked: false,
        describe,
        number: 1,
      };

      expectations[describe.toUpperCase() + ' ' + assertion + ' 2'] = {
        assertion,
        checked: false,
        describe,
        number: 2,
      };
    });
  });

  results.forEach(result => {
    const check = expectations[result.name];
    check.checked =
      result.content === `${check.number} ${check.assertion} ${check.describe}`;
  });
  expect(
    Object.keys(expectations)
      .map(key => expectations[key])
      .filter(expectation => !expectation.checked).length,
  ).toBe(0);
});

test('nested.example', () => {
  const filePath = path.join(snapshotFixturePath, 'nested.example');
  const results = snapshotHelper.getMetadata(filePath);
  expect(results[0].content).toBe('first nested');
  expect(results[1].content).toBe('second nested');

  expect(results[0].name).toBe(
    'outer describe outer it inner describe inner it 1',
  );
  expect(results[1].name).toBe(
    'outer describe outer it inner describe inner it 2',
  );

  expect(results[0].node.loc.start).toEqual({column: 21, line: 5});
  expect(results[0].node.loc.end).toEqual({column: 36, line: 5});
  expect(results[1].node.loc.start).toEqual({column: 21, line: 6});
  expect(results[1].node.loc.end).toEqual({column: 36, line: 6});
});
