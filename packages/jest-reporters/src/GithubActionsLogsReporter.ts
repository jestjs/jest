import chalk = require('chalk');
import type {
  AggregatedResult,
  AssertionResult,
  Test,
  TestContext,
  TestResult,
} from '@jest/test-result';
import DefaultReporter from './DefaultReporter';

type performaceInfo = {
  end: number;
  runtime: number;
  slow: boolean;
  start: number;
};

type resultTreeLeaf = {
  name: string;
  passed: boolean;
  duration: number;
  children: Array<never>;
};

type resultTreeNode = {
  name: string;
  passed: boolean;
  children: Array<resultTreeNode | resultTreeLeaf>;
};

type resultTree = {
  children: Array<resultTreeLeaf | resultTreeNode>;
  name: string;
  passed: boolean;
  performanceInfo: performaceInfo;
};

export default class GithubActionsLogsReporter extends DefaultReporter {
  override onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    this.__printFullResult(test.context, testResult);
    if (this.__isLastTestSuite(aggregatedResults)) {
      this.log('');
      if (this.__printFailedTestLogs(test, aggregatedResults)) {
        this.log('');
      }
    }
  }

  __isLastTestSuite(results: AggregatedResult): boolean {
    const passedTestSuites = results.numPassedTestSuites;
    const failedTestSuites = results.numFailedTestSuites;
    const totalTestSuites = results.numTotalTestSuites;
    const computedTotal = passedTestSuites + failedTestSuites;
    if (computedTotal < totalTestSuites) {
      return false;
    } else if (computedTotal === totalTestSuites) {
      return true;
    } else {
      throw new Error(
        `Sum(${computedTotal}) of passed (${passedTestSuites}) and failed (${failedTestSuites}) test suites is greater than the total number of test suites (${totalTestSuites}). Please report the bug at https://github.com/facebook/jest/issues`,
      );
    }
  }

  __printFullResult(context: TestContext, results: TestResult): void {
    const rootDir = context.config.rootDir;
    let testDir = results.testFilePath.replace(rootDir, '');
    testDir = testDir.slice(1, testDir.length);
    const resultTree = this.__getResultTree(
      results.testResults,
      testDir,
      results.perfStats,
    );
    this.__printResultTree(resultTree);
  }

  __arrayEqual(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length !== a2.length) {
      return false;
    }
    for (let index = 0; index < a1.length; index++) {
      const element = a1[index];
      if (element !== a2[index]) {
        return false;
      }
    }
    return true;
  }

  __arrayChild(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length - a2.length !== 1) {
      return false;
    }
    for (let index = 0; index < a2.length; index++) {
      const element = a2[index];
      if (element !== a1[index]) {
        return false;
      }
    }
    return true;
  }

  __getResultTree(
    suiteResult: Array<AssertionResult>,
    testPath: string,
    suitePerf: performaceInfo,
  ): resultTree {
    const root: resultTree = {
      children: [],
      name: testPath,
      passed: true,
      performanceInfo: suitePerf,
    };
    const branches: Array<Array<string>> = [];
    suiteResult.forEach(element => {
      if (element.ancestorTitles.length === 0) {
        let passed = true;
        if (element.status === 'failed') {
          root.passed = false;
          passed = false;
        } else if (element.status !== 'passed') {
          throw new Error(
            `Expected status to be 'failed' or 'passed', got ${element.status}`,
          );
        }
        if (!element.duration || isNaN(element.duration)) {
          throw new Error('Expected duration to be a number, got NaN');
        }
        root.children.push({
          children: [],
          duration: Math.max(element.duration, 1),
          name: element.title,
          passed,
        });
      } else {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.__arrayEqual(
              branches[index],
              element.ancestorTitles.slice(0, 1),
            )
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, 1));
        }
      }
    });
    branches.forEach(element => {
      const newChild = this.__getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        root.passed = false;
      }
      root.children.push(newChild);
    });
    return root;
  }

  __getResultChildren(
    suiteResult: Array<AssertionResult>,
    ancestors: Array<string>,
  ): resultTreeNode {
    const node: resultTreeNode = {
      children: [],
      name: ancestors[ancestors.length - 1],
      passed: true,
    };
    const branches: Array<Array<string>> = [];
    suiteResult.forEach(element => {
      let passed = true;
      let duration = element.duration;
      if (!duration || isNaN(duration)) {
        duration = 1;
      }
      if (this.__arrayEqual(element.ancestorTitles, ancestors)) {
        if (element.status === 'failed') {
          node.passed = false;
          passed = false;
        }
        node.children.push({
          children: [],
          duration,
          name: element.title,
          passed,
        });
      } else if (
        this.__arrayChild(
          element.ancestorTitles.slice(0, ancestors.length + 1),
          ancestors,
        )
      ) {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.__arrayEqual(
              branches[index],
              element.ancestorTitles.slice(0, ancestors.length + 1),
            )
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, ancestors.length + 1));
        }
      }
    });
    branches.forEach(element => {
      const newChild = this.__getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        node.passed = false;
      }
      node.children.push(newChild);
    });
    return node;
  }

  __printResultTree(resultTree: resultTree): void {
    let perfMs;
    if (resultTree.performanceInfo.slow) {
      perfMs = ` (${chalk.red.inverse(
        `${resultTree.performanceInfo.runtime} ms`,
      )})`;
    } else {
      perfMs = ` (${resultTree.performanceInfo.runtime} ms)`;
    }
    if (resultTree.passed) {
      this.__startGroup(
        `${chalk.bold.green.inverse('PASS')} ${resultTree.name}${perfMs}`,
      );
      resultTree.children.forEach(child => {
        this.__recursivePrintResultTree(child, true, 1);
      });
      this.__endGroup();
    } else {
      this.log(
        `  ${chalk.bold.red.inverse('FAIL')} ${resultTree.name}${perfMs}`,
      );
      resultTree.children.forEach(child => {
        this.__recursivePrintResultTree(child, false, 1);
      });
    }
  }

  __recursivePrintResultTree(
    resultTree: resultTreeNode | resultTreeLeaf,
    alreadyGrouped: boolean,
    depth: number,
  ): void {
    if (resultTree.children.length === 0) {
      if (!('duration' in resultTree)) {
        throw new Error('Expected a leaf. Got a node.');
      }
      let numberSpaces = depth;
      if (!alreadyGrouped) {
        numberSpaces++;
      }
      const spaces = '  '.repeat(numberSpaces);
      let resultSymbol;
      if (resultTree.passed) {
        resultSymbol = chalk.green('\u2713');
      } else {
        resultSymbol = chalk.red('\u00D7');
      }
      this.log(
        `${spaces + resultSymbol} ${resultTree.name} (${
          resultTree.duration
        } ms)`,
      );
    } else {
      if (resultTree.passed) {
        if (alreadyGrouped) {
          this.log('  '.repeat(depth) + resultTree.name);
          resultTree.children.forEach(child => {
            this.__recursivePrintResultTree(child, true, depth + 1);
          });
        } else {
          this.__startGroup('  '.repeat(depth) + resultTree.name);
          resultTree.children.forEach(child => {
            this.__recursivePrintResultTree(child, true, depth + 1);
          });
          this.__endGroup();
        }
      } else {
        this.log('  '.repeat(depth + 1) + resultTree.name);
        resultTree.children.forEach(child => {
          this.__recursivePrintResultTree(child, false, depth + 1);
        });
      }
    }
  }

  __printFailedTestLogs(context: Test, testResults: AggregatedResult): boolean {
    const rootDir = context.context.config.rootDir;
    const results = testResults.testResults;
    let written = false;
    results.forEach(result => {
      let testDir = result.testFilePath;
      testDir = testDir.replace(rootDir, '');
      testDir = testDir.slice(1, testDir.length);
      if (result.failureMessage) {
        written = true;
        this.__startGroup(`Errors thrown in ${testDir}`);
        this.log(result.failureMessage);
        this.__endGroup();
      }
    });
    return written;
  }

  __startGroup(title: string): void {
    this.log(`::group::${title}`);
  }

  __endGroup(): void {
    this.log('::endgroup::');
  }

  override log(message: string): void {
    super.log(`${message}\n`);
  }
}
