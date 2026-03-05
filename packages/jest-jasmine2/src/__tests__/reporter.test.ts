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
      }) as any as SpecResult;
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

  const extractFailureMessage = (error: Error) => {
    const spec = {
      description: 'description',
      failedExpectations: [
        {
          error,
          matcherName: '',
          message: error.message,
          passed: false,
          stack: error.stack,
        },
      ],
      fullName: 'spec with cause',
      id: '1',
      status: 'failed',
    } as any as SpecResult;

    const extracted = (
      reporter as unknown as {
        _extractSpecResults: (
          specResult: SpecResult,
          ancestorTitles: Array<string>,
        ) => {failureMessages: Array<string>};
      }
    )._extractSpecResults(spec, []);

    return extracted.failureMessages[0];
  };

  it('serializes nested Error.cause in failure messages', () => {
    const message = extractFailureMessage(
      new Error('error during f', {cause: new Error('error during g')}),
    );

    expect(message).toContain('[cause]: Error: error during g');
  });

  it('serializes string Error.cause in failure messages', () => {
    const message = extractFailureMessage(
      new Error('error during f', {cause: 'here is the cause'}),
    );

    expect(message).toContain('[cause]: here is the cause');
  });

  it('protects against circular Error.cause in failure messages', () => {
    const error = new Error('error during f') as Error & {cause?: unknown};
    error.cause = error;

    const message = extractFailureMessage(error);

    expect(message).toContain('[Circular cause]');
  });
});
