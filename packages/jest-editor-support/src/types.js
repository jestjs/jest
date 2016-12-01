// @flow
'use strict';

export type Location = {
    line: number,
    column: number,
}

export type JestFileResults = {
    name: string,
    summary: string,
    message: string,
    status: "failed" | "passed",
    startTime:number,
    endTime:number,
    assertionResults: JestAssertionResults[],
}

export type JestAssertionResults = {
    name: string,
    title: string,
    status: "failed" | "passed",
    failureMessages: string[],
}

export type JestTotalResults = {
    success:boolean,
    startTime:number,
    numTotalTests:number,
    numTotalTestSuites:number,
    numRuntimeErrorTestSuites:number,
    numPassedTests:number,
    numFailedTests:number,
    numPendingTests:number,
    testResults: JestFileResults[],
}

/**
 *  Did the thing pass, fail or was it not run?
 */
export type TestReconcilationState =
  /** This could be the file has not changed, so the watcher didn't hit it */
  | "Unknown"
  /** Definitely failed */
  | "KnownFail"
  /** Definitely passed */
  | "KnownSuccess"

/**
 * The Jest Extension's version of a status for
 * whether the file passed or not
 * 
 */
export type TestFileAssertionStatus = {
  file: string,
  message: string,
  status: TestReconcilationState,
  assertions: TestAssertionStatus[],
}

/**
 * The Jest Extension's version of a status for
 * individual assertion fails
 * 
 */
export type TestAssertionStatus = {
  title: string,
  status: TestReconcilationState,
  message: string,
  shortMessage: ?string,
  terseMessage: ?string,
  line: ?number,
}
