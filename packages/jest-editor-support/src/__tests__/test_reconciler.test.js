/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import fs from 'fs';
import path from 'path';
import TestReconciler from '../test_reconciler';
import type {TestFileAssertionStatus, TestAssertionStatus} from '../types';

const fixtures = path.resolve(__dirname, '../../../../fixtures');

function reconcilerWithFile(
  parser: TestReconciler,
  file: string,
): TestFileAssertionStatus[] {
  const exampleJSON = fs.readFileSync(`${fixtures}/failing_jsons/${file}`);
  const json = JSON.parse(exampleJSON.toString());
  if (!parser) console.error('no parser for ', file);
  return parser.updateFileWithJestStatus(json);
}

describe('Test Reconciler', () => {
  let parser: TestReconciler;
  let results: TestFileAssertionStatus[];

  const dangerFilePath =
    '/Users/orta/dev/projects/danger/' +
    'danger-js/source/ci_source/_tests/_travis.test.js';

  describe('for a simple project', () => {
    beforeAll(() => {
      parser = new TestReconciler();
      results = reconcilerWithFile(parser, 'failing_jest_json.json');
    });

    it('returns expected result for all test suites', () => {
      expect(results.length).toEqual(5);
    });
    it('passes a passing method', () => {
      const testName = 'does not validate without josh';
      const status: any = parser.stateForTestAssertion(
        dangerFilePath,
        testName,
      );
      expect(status.status).toEqual('KnownSuccess');
      expect(status.line).toBeNull();
    });

    it('fails a failing method in the same file', () => {
      const testName =
        'validates when all Travis environment' +
        ' vars are set and Josh K says so';

      const status: any = parser.stateForTestAssertion(
        dangerFilePath,
        testName,
      );
      expect(status.status).toEqual('KnownFail');
      expect(status.line).toEqual(12);
      const errorMessage = 'Expected value to be falsy, instead received true';
      expect(status.terseMessage).toEqual(errorMessage);
      expect(status.shortMessage).toEqual(`Error: expect(received).toBeFalsy()

Expected value to be falsy, instead received
  true`);
    });

    it('skips a skipped method', () => {
      const testName = 'does not pull it out of the env';
      const status: any = parser.stateForTestAssertion(
        dangerFilePath,
        testName,
      );
      expect(status.status).toEqual('KnownSkip');
      expect(status.line).toBeNull();
    });
  });

  describe('in a monorepo project', () => {
    beforeEach(() => {
      parser = new TestReconciler();
      results = reconcilerWithFile(parser, 'monorepo_root_1.json');
    });

    it('did processed all test suits including the suites failed to run', () => {
      expect(results.length).toEqual(8);
      const failed = results.filter(r => r.status === 'KnownFail');
      expect(failed.length).toEqual(4);
      //2 of them is failed suite, i.e. no assertions
      expect(
        failed.filter(r => !r.assertions || r.assertions.length === 0).length,
      ).toEqual(2);
    });
    it('did catch the passed tests', () => {
      const succeededSuites = results.filter(r => r.status === 'KnownSuccess');
      expect(succeededSuites.length).toEqual(4);

      const succeededTests = results
        .map(r => r.assertions || [])
        .reduce((sum: number, assertions: TestAssertionStatus[]) => {
          const success = assertions.filter(a => a.status === 'KnownSuccess');
          return sum + success.length;
        }, 0);
      expect(succeededTests).toEqual(46);
    });
    describe('when test updated', () => {
      const targetTests = {
        failedThenRemoved: [
          '/X/packages/Y-core/src/eth/__tests__/types.test.ts',
          'should fail',
        ],
        missingThenFailed: [
          '/X/packages/Y-app-vault/native/__tests__/index.ios.js',
          'testing jest with react-native',
        ],
        missingThenFixed: [
          '/X/packages/Y-app-vault/native/__tests__/index.ios.js',
          'renders correctly',
        ],
        passed: [
          '/X/packages/Y-keeper/src/redux/middlewares/__tests__/createGateMonitor.test.ts',
          'can log/profile doable async actions',
        ],
      };

      function verifyTest(key: string, expectedStatus?: string) {
        const test = parser.stateForTestAssertion(
          targetTests[key][0],
          targetTests[key][1],
        );
        if (!test && !expectedStatus) {
          return;
        }
        if (expectedStatus && test) {
          expect(test.status).toEqual(expectedStatus);
          return;
        }
        expect(key + ': ' + JSON.stringify(test)).toEqual(expectedStatus); // failed!
      }

      it('verify before update occurred', () => {
        verifyTest('missingThenFixed', undefined);
        verifyTest('missingThenFailed', undefined);
        verifyTest('failedThenRemoved', 'KnownFail');
        verifyTest('passed', 'KnownSuccess');
      });

      it('new file can update existing result', () => {
        //in file 2 we fixed 2 failed suites and removed 1 failed test
        //let's check the failed tests are now passed, while the previously
        //passed test should still be accessible
        const results2 = reconcilerWithFile(parser, 'monorepo_root_2.json');
        expect(results2.length).toEqual(4);

        verifyTest('missingThenFixed', 'KnownSuccess');
        verifyTest('missingThenFailed', 'KnownFail');
        verifyTest('failedThenRemoved', undefined);
        verifyTest('passed', 'KnownSuccess');
      });
    });
  });
});

describe('Terse Messages', () => {
  let parser: TestReconciler;
  // let results: TestFileAssertionStatus[];

  beforeEach(() => {
    parser = new TestReconciler();
    const _ = reconcilerWithFile(parser, 'failing_expects.json');
  });

  it('handles shrinking a snapshot message', () => {
    const file =
      '/Users/orta/dev/projects/artsy/js/' +
      'libs/jest-snapshots-svg/src/_tests/example.test.ts';

    const terseForTest = name => parser.stateForTestAssertion(file, name);

    let message = 'Expected value to equal: 2, Received: 1';
    let testName = 'numbers';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Expected value to equal: 2, Received: "1"';
    testName = 'string to numbers: numbers';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Expected value to equal: {"a": 2}, Received: {}';
    testName = 'objects';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Snapshot has changed';
    testName = 'snapshots';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Expected value to be greater than: 3, Received: 2';
    testName = 'greater than';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Expected value to be falsy, instead received 2';
    testName = 'falsy';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);

    message = 'Expected value to be truthy, instead received null';
    testName = 'truthy';
    expect(terseForTest(testName)).toHaveProperty('terseMessage', message);
  });
});
