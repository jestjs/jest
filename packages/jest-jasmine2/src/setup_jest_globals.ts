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
import type {default as JasmineSuite} from './jasmine/Suite';

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
  if (suppressedErrors.length > 0) {
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
  if (assertionErrors.length > 0) {
    const jasmineErrors = assertionErrors.map(({actual, error, expected}) => ({
      actual,
      expected,
      message: error.stack,
      passed: false,
    }));
    result.status = 'failed';
    result.failedExpectations = [
      ...result.failedExpectations,
      ...jasmineErrors,
    ];
  }
};

// Position of each spec among the specs sharing its full name, counting from 1
// in declaration order. Specs with a unique name are left out, so the common
// case stays empty.
const buildTestNameOccurrences = (topSuite: JasmineSuite) => {
  const specsByFullName = new Map<string, Array<JasmineSpec>>();

  const collect = (suite: JasmineSuite) => {
    for (const child of suite.children) {
      if ('children' in child) {
        collect(child);
      } else {
        const fullName = child.getFullName();
        const namesakes = specsByFullName.get(fullName);
        if (namesakes === undefined) {
          specsByFullName.set(fullName, [child]);
        } else {
          namesakes.push(child);
        }
      }
    }
  };
  collect(topSuite);

  const occurrences = new Map<JasmineSpec, number>();
  for (const namesakes of specsByFullName.values()) {
    if (namesakes.length > 1) {
      for (const [index, spec] of namesakes.entries()) {
        occurrences.set(spec, index + 1);
      }
    }
  }
  return occurrences;
};

let testNameOccurrences: Map<JasmineSpec, number> | undefined;

// Jasmine is patched before the test file declares anything, so the tree only
// exists once the first spec starts.
const getTestNameOccurrence = (spec: JasmineSpec) => {
  testNameOccurrences ??= buildTestNameOccurrences(
    // @ts-expect-error: jasmine doesn't exist on globalThis
    globalThis.jasmine.getEnv().topSuite(),
  );
  return testNameOccurrences.get(spec);
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
          jestExpect.setState({
            currentTestName: context.getFullName(),
            currentTestNameOccurrence: () => getTestNameOccurrence(context),
          });
          onStart?.call(attr, context);
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
  for (let i = config.snapshotSerializers.length - 1; i >= 0; i--) {
    addSerializer(localRequire(config.snapshotSerializers[i]));
  }

  // The module outlives a single test file, so the previous file's tree must
  // not answer for this one.
  testNameOccurrences = undefined;

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
