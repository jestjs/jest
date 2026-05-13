/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type TestStatus = 'failed' | 'passed' | 'skipped';

type TestResult = {
  error?: Error;
  fullName: string;
  name: string;
  status: TestStatus;
};

type RunResult = {
  failed: number;
  passed: number;
  skipped: number;
  tests: Array<TestResult>;
};

type TestEntry = {
  (name: string, fn: () => Promise<void> | void): void;
  each: (
    table: ReadonlyArray<ReadonlyArray<unknown>>,
  ) => (
    name: string,
    fn: (...row: Array<unknown>) => Promise<void> | void,
  ) => void;
  only: (name: string, fn: () => Promise<void> | void) => void;
  skip: (name: string, fn: () => Promise<void> | void) => void;
};

type DescribeEntry = {
  (name: string, fn: () => unknown): void;
  only: (name: string, fn: () => unknown) => void;
  skip: (name: string, fn: () => unknown) => void;
};

type RunnerApi = {
  afterAll: (fn: () => Promise<void> | void) => void;
  afterEach: (fn: () => Promise<void> | void) => void;
  beforeAll: (fn: () => Promise<void> | void) => void;
  beforeEach: (fn: () => Promise<void> | void) => void;
  describe: DescribeEntry;
  it: TestEntry;
  run: () => Promise<RunResult>;
  test: TestEntry;
};

type RunnerModule = {
  createTestRunner: () => RunnerApi;
};

function loadModule(): RunnerModule {
  return require('../../client/tester/runner') as RunnerModule;
}

describe('createTestRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runs beforeAll -> beforeEach -> test -> afterEach -> afterAll in order', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const order: Array<string> = [];

    runner.beforeAll(() => {
      order.push('beforeAll');
    });
    runner.beforeEach(() => {
      order.push('beforeEach');
    });
    runner.afterEach(() => {
      order.push('afterEach');
    });
    runner.afterAll(() => {
      order.push('afterAll');
    });

    runner.test('alpha', () => {
      order.push('test:alpha');
    });

    const result = await runner.run();

    expect(order).toEqual([
      'beforeAll',
      'beforeEach',
      'test:alpha',
      'afterEach',
      'afterAll',
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        failed: 0,
        passed: 1,
        skipped: 0,
      }),
    );
  });

  test('runs nested describe hooks and composes full test names', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const order: Array<string> = [];

    runner.describe('root', () => {
      runner.beforeEach(() => {
        order.push('root:beforeEach');
      });
      runner.afterEach(() => {
        order.push('root:afterEach');
      });

      runner.describe('child', () => {
        runner.beforeEach(() => {
          order.push('child:beforeEach');
        });
        runner.afterEach(() => {
          order.push('child:afterEach');
        });

        runner.it('works', () => {
          order.push('test:works');
        });
      });
    });

    const result = await runner.run();

    expect(order).toEqual([
      'root:beforeEach',
      'child:beforeEach',
      'test:works',
      'child:afterEach',
      'root:afterEach',
    ]);
    expect(result.tests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: 'root child works',
          name: 'works',
          status: 'passed',
        }),
      ]),
    );
  });

  test('supports describe.skip and test.skip without executing body', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const calls = jest.fn();

    runner.describe.skip('skipped suite', () => {
      runner.test('never', () => {
        calls();
      });
    });

    runner.test.skip('standalone skipped', () => {
      calls();
    });

    const result = await runner.run();

    expect(calls).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        failed: 0,
        passed: 0,
        skipped: 2,
      }),
    );
    expect(result.tests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: 'skipped suite never',
          status: 'skipped',
        }),
        expect.objectContaining({
          fullName: 'standalone skipped',
          status: 'skipped',
        }),
      ]),
    );
  });

  test('supports .only on suites and tests', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const calls: Array<string> = [];

    runner.describe('suite-a', () => {
      runner.test('test-a1', () => {
        calls.push('a1');
      });
      runner.test.only('test-a2-only', () => {
        calls.push('a2');
      });
    });

    runner.describe.only('suite-b-only', () => {
      runner.test('test-b1', () => {
        calls.push('b1');
      });
    });

    runner.test('top-level', () => {
      calls.push('top');
    });

    const result = await runner.run();

    expect(calls).toEqual(['a2', 'b1']);
    expect(result).toEqual(
      expect.objectContaining({
        failed: 0,
        passed: 2,
      }),
    );
  });

  test('supports test.each for table-driven cases', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const seen: Array<number> = [];

    runner.test.each([
      [1, 2, 3],
      [2, 3, 5],
      [3, 5, 8],
    ])('sum(%i, %i) = %i', (a, b, expected) => {
      const left = Number(a);
      const right = Number(b);
      const sum = left + right;
      expect(sum).toBe(Number(expected));
      seen.push(sum);
    });

    const result = await runner.run();

    expect(seen).toEqual([3, 5, 8]);
    expect(result).toEqual(
      expect.objectContaining({
        failed: 0,
        passed: 3,
        skipped: 0,
      }),
    );
  });

  test('records failing tests and continues running remaining tests', async () => {
    const {createTestRunner} = loadModule();
    const runner = createTestRunner();
    const calls: Array<string> = [];

    runner.test('fails', () => {
      calls.push('fails:start');
      throw new Error('boom');
    });

    runner.test('passes after failure', () => {
      calls.push('passes:start');
    });

    const result = await runner.run();

    expect(calls).toEqual(['fails:start', 'passes:start']);
    expect(result).toEqual(
      expect.objectContaining({
        failed: 1,
        passed: 1,
      }),
    );
    expect(result.tests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: 'fails',
          status: 'failed',
        }),
        expect.objectContaining({
          fullName: 'passes after failure',
          status: 'passed',
        }),
      ]),
    );
  });
});
