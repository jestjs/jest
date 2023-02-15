/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import FailedTestsInteractivePlugin from '../FailedTestsInteractive';

describe('FailedTestsInteractive', () => {
  it('returns usage info when failing tests are present', () => {
    expect(new FailedTestsInteractivePlugin({}).getUsageInfo()).toBeNull();

    const mockUpdate = jest.fn();
    const activateablePlugin = new FailedTestsInteractivePlugin({});
    const testAggregate = {
      snapshot: {},
      testResults: [
        {
          testFilePath: '/tmp/mock-path',
          testResults: [{fullName: 'test-name', status: 'failed'}],
        },
      ],
    };
    let mockCallback;

    activateablePlugin.apply({
      onTestRunComplete: callback => {
        mockCallback = callback;
      },
    });

    mockCallback(testAggregate);
    activateablePlugin.run(null, mockUpdate);

    expect(activateablePlugin.getUsageInfo()).toEqual({
      key: 'i',
      prompt: 'run failing tests interactively',
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      mode: 'watch',
      testNamePattern: `^${testAggregate.testResults[0].testResults[0].fullName}$`,
      testPathPattern: testAggregate.testResults[0].testFilePath,
    });
  });
});
