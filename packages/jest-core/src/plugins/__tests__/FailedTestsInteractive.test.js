import FailedTestsInteractivePlugin from '../FailedTestsInteractive';

describe('FailedTestsInteractive', () => {
  it('returns usage info when failing tests are present', () => {
    expect(new FailedTestsInteractivePlugin({}).getUsageInfo()).toBeNull();

    const activateablePlugin = new FailedTestsInteractivePlugin({});
    let mockCallback;

    activateablePlugin.apply({
      onTestRunComplete: callback => {
        mockCallback = callback;
      },
    });

    mockCallback({
      snapshot: {},
      testResults: [{testResults: [{status: 'failed'}]}],
    });

    expect(activateablePlugin.getUsageInfo()).toEqual({
      key: 'i',
      prompt: 'run failing tests interactively',
    });
  });

  it('calls config update when receiving failed tests', () => {
    const mockUpdate = jest.fn();
    const plugin = new FailedTestsInteractivePlugin({});
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

    plugin.apply({
      onTestRunComplete: callback => {
        mockCallback = callback;
      },
    });

    mockCallback(testAggregate);

    plugin.run(null, mockUpdate);

    expect(mockUpdate).toHaveBeenCalledWith({
      mode: 'watch',
      testNamePattern: `^${testAggregate.testResults[0].testResults[0].fullName}$`,
      testPathPattern: testAggregate.testResults[0].testFilePath,
    });
  });
});
