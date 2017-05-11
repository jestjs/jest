/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const TestReconciler = require('../TestReconciler');
const fixtures = path.resolve(__dirname, '../../../../fixtures');

const reconcilerWithFile = (file: string): TestReconciler => {
  const parser = new TestReconciler();
  const exampleJSON = fs.readFileSync(`${fixtures}/failing_jsons/${file}`);
  const json = JSON.parse(exampleJSON.toString());
  parser.updateFileWithJestStatus(json);
  return parser;
};

describe('Test Reconciler', () => {
  let parser: TestReconciler;
  const dangerFilePath =
    '/Users/orta/dev/projects/danger/' +
    'danger-js/source/ci_source/_tests/_travis.test.js';

  describe('for a simple project', () => {
    it('passes a passing method', () => {
      parser = reconcilerWithFile('failing_jest_json.json');
      const testName = 'does not validate without josh';
      const status = parser.stateForTestAssertion(dangerFilePath, testName);
      expect(status.status).toEqual('KnownSuccess');
      expect(status.line).toBeNull();
    });

    it('fails a failing method in the same file', () => {
      parser = reconcilerWithFile('failing_jest_json.json');
      const testName =
        'validates when all Travis environment' +
        ' vars are set and Josh K says so';

      const status = parser.stateForTestAssertion(dangerFilePath, testName);
      expect(status.status).toEqual('KnownFail');
      expect(status.line).toEqual(12);
      const errorMessage = 'Expected value to be falsy, instead received true';
      expect(status.terseMessage).toEqual(errorMessage);
      expect(status.shortMessage).toEqual(`Error: expect(received).toBeFalsy()

Expected value to be falsy, instead received
  true`);
    });
  });
});
