/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jestExpect} from '@jest/expect';
import type {Config} from '@jest/types';
import {
  SnapshotState,
  addSerializer,
  buildSnapshotResolver,
} from 'jest-snapshot';
import type {Plugin} from 'pretty-format';
import type {
  Attributes,
  default as JasmineSpec,
  SpecResult,
} from './jasmine/Spec';

export type SetupOptions = {
  config: Config.ProjectConfig;
  globalConfig: Config.GlobalConfig;
  localRequire: (moduleName: string) => Plugin;
  testPath: string;
};

// Get suppressed errors form  jest-matchers that weren't throw during
// test execution and add them to the test result, potentially failing
// a passing test.
const addSuppressedErrors = (result: SpecResult) => {
  const {suppressedErrors} = jestExpect.getState();
  jestExpect.setState({suppressedErrors: []});
  if (suppressedErrors.length) {
    result.status = 'failed';

    result.failedExpectations = suppressedErrors.map(error => ({
      actual: '',
      // passing error for custom test reporters
      error,
      expected: '',
      matcherName: '',
      message: error.message,
      passed: false,
      stack: error.stack,
    }));
  }
};

const addAssertionErrors = (result: SpecResult) => {
  const assertionErrors = jestExpect.extractExpectedAssertionsErrors();
  if (assertionErrors.length) {
    const jasmineErrors = assertionErrors.map(({actual, error, expected}) => ({
      actual,
      expected,
      message: error.stack,
      passed: false,
    }));
    result.status = 'failed';
    result.failedExpectations = result.failedExpectations.concat(jasmineErrors);
  }
};

const patchJasmine = () => {
  // @ts-expect-error: jasmine doesn't exist on globalThis
  globalThis.jasmine.Spec = (realSpec => {
    class Spec extends realSpec {
      constructor(attr: Attributes) {
        const resultCallback = attr.resultCallback;
        attr.resultCallback = function (result: SpecResult) {
          addSuppressedErrors(result);
          addAssertionErrors(result);
          resultCallback.call(attr, result);
        };
        const onStart = attr.onStart;
        attr.onStart = (context: JasmineSpec) => {
          jestExpect.setState({currentTestName: context.getFullName()});
          onStart && onStart.call(attr, context);
        };
        super(attr);
      }
    }

    return Spec;
    // @ts-expect-error: jasmine doesn't exist on globalThis
  })(globalThis.jasmine.Spec);
};

export default async function setupJestGlobals({
  config,
  globalConfig,
  localRequire,
  testPath,
}: SetupOptions): Promise<SnapshotState> {
  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  config.snapshotSerializers
    .concat()
    .reverse()
    .forEach(path => {
      addSerializer(localRequire(path));
    });

  patchJasmine();
  const {expand, updateSnapshot} = globalConfig;
  const {prettierPath, rootDir, snapshotFormat} = config;
  const snapshotResolver = await buildSnapshotResolver(config, localRequire);
  const snapshotPath = snapshotResolver.resolveSnapshotPath(testPath);
  const snapshotState = new SnapshotState(snapshotPath, {
    expand,
    prettierPath,
    rootDir,
    snapshotFormat,
    updateSnapshot,
  });

  jestExpect.setState({snapshotState, testPath});
  // Return it back to the outer scope (test runner outside the VM).
  return snapshotState;
}
