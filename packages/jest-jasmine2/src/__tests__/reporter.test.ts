/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {SpecResult} from '../jasmine/Spec';
import type {SuiteResult} from '../jasmine/Suite';
import JasmineReporter from '../reporter';

describe('Jasmine2Reporter', () => {
  let reporter: JasmineReporter;

  beforeEach(() => {
    // @ts-expect-error
    reporter = new JasmineReporter({});
  });

  it('reports nested suites', () => {
    const makeSpec = (name: string) =>
      ({
        description: 'description',
        failedExpectations: [],
        fullName: name,
      } as any as SpecResult);
    reporter.suiteStarted({description: 'parent'} as SuiteResult);
    reporter.suiteStarted({description: 'child'} as SuiteResult);
    reporter.specDone(makeSpec('spec 1'));
    // @ts-expect-error
    reporter.suiteDone();
    reporter.suiteStarted({description: 'child 2'} as SuiteResult);
    reporter.specDone(makeSpec('spec 2'));
    // @ts-expect-error
    reporter.jasmineDone();

    return reporter.getResults().then(runResults => {
      const firstResult = runResults.testResults[0];
      expect(firstResult.ancestorTitles[0]).toBe('parent');
      expect(firstResult.ancestorTitles[1]).toBe('child');
      const secondResult = runResults.testResults[1];
      expect(secondResult.ancestorTitles[1]).toBe('child 2');
    });
  });
});
