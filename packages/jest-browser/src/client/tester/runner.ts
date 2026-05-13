/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable unicorn/no-useless-switch-case */

type Hook = () => void | Promise<void>;
type TestFn = () => void | Promise<void>;
type TestMode = 'normal' | 'only' | 'skip';
type TestStatus = 'failed' | 'passed' | 'skipped';

type TestNode = {
  fn: TestFn;
  mode: TestMode;
  name: string;
  suite: SuiteNode;
};

type SuiteEntry =
  | {
      suite: SuiteNode;
      type: 'suite';
    }
  | {
      test: TestNode;
      type: 'test';
    };

type SuiteNode = {
  afterAll: Array<Hook>;
  afterEach: Array<Hook>;
  beforeAll: Array<Hook>;
  beforeEach: Array<Hook>;
  entries: Array<SuiteEntry>;
  mode: TestMode;
  name: string;
  parent?: SuiteNode;
};

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

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(String(value));
}

function formatEachName(name: string, row: ReadonlyArray<unknown>): string {
  let index = 0;

  return name.replaceAll(/%[%sdifjo]/g, token => {
    if (token === '%%') {
      return '%';
    }

    if (index >= row.length) {
      return token;
    }

    const value = row[index++];

    switch (token) {
      case '%d':
      case '%f':
      case '%i':
        return String(Number(value));
      case '%j':
      case '%o':
        try {
          return JSON.stringify(value);
        } catch {
          return '[Circular]';
        }
      case '%s':
      default:
        return String(value);
    }
  });
}

function hasOnlyInTree(suite: SuiteNode): boolean {
  if (suite.mode === 'only') {
    return true;
  }

  for (const entry of suite.entries) {
    if (entry.type === 'test' && entry.test.mode === 'only') {
      return true;
    }

    if (entry.type === 'suite' && hasOnlyInTree(entry.suite)) {
      return true;
    }
  }

  return false;
}

function hasSkippedInChain(
  suites: Array<SuiteNode>,
  testMode?: TestMode,
): boolean {
  if (testMode === 'skip') {
    return true;
  }

  for (const suite of suites) {
    if (suite.mode === 'skip') {
      return true;
    }
  }

  return false;
}

function isOnlySelected(
  suites: Array<SuiteNode>,
  testMode: TestMode,
  hasOnly: boolean,
): boolean {
  if (!hasOnly) {
    return true;
  }

  if (testMode === 'only') {
    return true;
  }

  for (const suite of suites) {
    if (suite.mode === 'only') {
      return true;
    }
  }

  return false;
}

function getTestFullName(suites: Array<SuiteNode>, test: TestNode): string {
  const suiteNames = suites
    .map(suite => suite.name)
    .filter(name => name.length > 0);
  return [...suiteNames, test.name].join(' ');
}

export function createTestRunner(): {
  afterAll: (fn: Hook) => void;
  afterEach: (fn: Hook) => void;
  beforeAll: (fn: Hook) => void;
  beforeEach: (fn: Hook) => void;
  describe: {
    (name: string, fn: () => unknown): void;
    only: (name: string, fn: () => unknown) => void;
    skip: (name: string, fn: () => unknown) => void;
  };
  it: {
    (name: string, fn: TestFn): void;
    each: (
      table: ReadonlyArray<ReadonlyArray<unknown>>,
    ) => (
      name: string,
      fn: (...row: Array<unknown>) => void | Promise<void>,
    ) => void;
    only: (name: string, fn: TestFn) => void;
    skip: (name: string, fn: TestFn) => void;
  };
  readonly currentTestName: string | null;
  run: () => Promise<RunResult>;
  test: {
    (name: string, fn: TestFn): void;
    each: (
      table: ReadonlyArray<ReadonlyArray<unknown>>,
    ) => (
      name: string,
      fn: (...row: Array<unknown>) => void | Promise<void>,
    ) => void;
    only: (name: string, fn: TestFn) => void;
    skip: (name: string, fn: TestFn) => void;
  };
} {
  const rootSuite: SuiteNode = {
    afterAll: [],
    afterEach: [],
    beforeAll: [],
    beforeEach: [],
    entries: [],
    mode: 'normal',
    name: '',
  };

  let currentSuite = rootSuite;
  let currentTestName: string | null = null;

  const addTest = (name: string, fn: TestFn, mode: TestMode): void => {
    const node: TestNode = {
      fn,
      mode,
      name,
      suite: currentSuite,
    };

    currentSuite.entries.push({
      test: node,
      type: 'test',
    });
  };

  const addSuite = (name: string, fn: () => unknown, mode: TestMode): void => {
    const parentSuite = currentSuite;
    const node: SuiteNode = {
      afterAll: [],
      afterEach: [],
      beforeAll: [],
      beforeEach: [],
      entries: [],
      mode,
      name,
      parent: parentSuite,
    };

    parentSuite.entries.push({
      suite: node,
      type: 'suite',
    });

    currentSuite = node;
    try {
      fn();
    } finally {
      currentSuite = parentSuite;
    }
  };

  const testEach =
    (mode: TestMode) =>
    (table: ReadonlyArray<ReadonlyArray<unknown>>) =>
    (
      name: string,
      fn: (...row: Array<unknown>) => void | Promise<void>,
    ): void => {
      for (const row of table) {
        const testName = formatEachName(name, row);
        addTest(
          testName,
          async () => {
            await fn(...row);
          },
          mode,
        );
      }
    };

  const run = async (): Promise<RunResult> => {
    const results: Array<TestResult> = [];
    const hasOnly = hasOnlyInTree(rootSuite);

    const suiteHasRunnable = (
      suite: SuiteNode,
      chain: Array<SuiteNode>,
    ): boolean => {
      for (const entry of suite.entries) {
        if (entry.type === 'test') {
          const selected = isOnlySelected(chain, entry.test.mode, hasOnly);
          const skipped = hasSkippedInChain(chain, entry.test.mode);
          if (selected && !skipped) {
            return true;
          }
          continue;
        }

        if (suiteHasRunnable(entry.suite, [...chain, entry.suite])) {
          return true;
        }
      }

      return false;
    };

    const runHooks = async (hooks: Array<Hook>): Promise<Error | undefined> => {
      for (const hook of hooks) {
        try {
          await hook();
        } catch (error) {
          return toError(error);
        }
      }

      return undefined;
    };

    const runSingleTest = async (
      suites: Array<SuiteNode>,
      test: TestNode,
    ): Promise<void> => {
      const selected = isOnlySelected(suites, test.mode, hasOnly);
      if (!selected) {
        return;
      }

      const skipped = hasSkippedInChain(suites, test.mode);
      if (skipped) {
        results.push({
          fullName: getTestFullName(suites, test),
          name: test.name,
          status: 'skipped',
        });
        return;
      }

      const testFullName = getTestFullName(suites, test);
      currentTestName = testFullName;

      const beforeEachHooks = suites.flatMap(suite => suite.beforeEach);
      const afterEachHooks = [...suites]
        .reverse()
        .flatMap(suite => suite.afterEach);

      let failure: Error | undefined;

      failure = await runHooks(beforeEachHooks);

      if (!failure) {
        try {
          await test.fn();
        } catch (error) {
          failure = toError(error);
        }
      }

      const afterEachFailure = await runHooks(afterEachHooks);
      if (!failure && afterEachFailure) {
        failure = afterEachFailure;
      }

      if (failure) {
        results.push({
          error: failure,
          fullName: getTestFullName(suites, test),
          name: test.name,
          status: 'failed',
        });
        return;
      }

      results.push({
        fullName: getTestFullName(suites, test),
        name: test.name,
        status: 'passed',
      });
    };

    const runSuite = async (
      suite: SuiteNode,
      chain: Array<SuiteNode>,
    ): Promise<void> => {
      const shouldRunAllHooks = suiteHasRunnable(suite, chain);
      if (shouldRunAllHooks) {
        await runHooks(suite.beforeAll);
      }

      for (const entry of suite.entries) {
        if (entry.type === 'test') {
          await runSingleTest(chain, entry.test);
          continue;
        }

        await runSuite(entry.suite, [...chain, entry.suite]);
      }

      if (shouldRunAllHooks) {
        await runHooks(suite.afterAll);
      }
    };

    await runSuite(rootSuite, [rootSuite]);

    const passed = results.filter(result => result.status === 'passed').length;
    const failed = results.filter(result => result.status === 'failed').length;
    const skipped = results.filter(
      result => result.status === 'skipped',
    ).length;

    return {
      failed,
      passed,
      skipped,
      tests: results,
    };
  };

  const describe = Object.assign(
    (name: string, fn: () => unknown): void => {
      addSuite(name, fn, 'normal');
    },
    {
      each:
        (table: Array<unknown>) =>
        (name: string, fn: (...args: Array<unknown>) => unknown): void => {
          for (const row of table) {
            const args = Array.isArray(row) ? row : [row];
            const testName = args.reduce<string>(
              (n, arg) => n.replace(/%[sdifjoOp%]/, String(arg)),
              name,
            );
            addSuite(testName, () => fn(...args), 'normal');
          }
        },
      only: (name: string, fn: () => unknown): void => {
        addSuite(name, fn, 'only');
      },
      skip: (name: string, fn: () => unknown): void => {
        addSuite(name, fn, 'skip');
      },
    },
  );

  const test = Object.assign(
    (name: string, fn: TestFn): void => {
      addTest(name, fn, 'normal');
    },
    {
      each: testEach('normal'),
      only: (name: string, fn: TestFn): void => {
        addTest(name, fn, 'only');
      },
      skip: (name: string, fn: TestFn): void => {
        addTest(name, fn, 'skip');
      },
    },
  );

  const it = test;

  return {
    afterAll: (fn: Hook): void => {
      currentSuite.afterAll.push(fn);
    },
    afterEach: (fn: Hook): void => {
      currentSuite.afterEach.push(fn);
    },
    beforeAll: (fn: Hook): void => {
      currentSuite.beforeAll.push(fn);
    },
    beforeEach: (fn: Hook): void => {
      currentSuite.beforeEach.push(fn);
    },
    get currentTestName() {
      return currentTestName;
    },
    describe,
    it,
    run,
    test,
  };
}
