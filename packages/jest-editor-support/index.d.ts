/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import {EventEmitter} from 'events';

export class Runner extends EventEmitter {
  constructor(workspace: ProjectWorkspace);
  start(): void;
  closeProcess(): void;
  runJestWithUpdateForSnapshots(completion: any): void;
}

export class Settings extends EventEmitter {
  constructor(workspace: ProjectWorkspace);
  getConfig(completed: Function): void;
  jestVersionMajor: number | null;
  settings: {
    testRegex: string;
  };
}

export class ProjectWorkspace {
  constructor(
    rootPath: string,
    pathToJest: string,
    pathToConfig: string,
    localJestMajorVersin: number
  );
  pathToJest: string;
  rootPath: string;
  localJestMajorVersion: number;
}

export interface IParseResults {
  expects: Expect[];
  itBlocks: ItBlock[];
}

export function parse(file: string): IParseResults;

export interface Location {
  column: number;
  line: number;
}

export class Node {
  start: Location;
  end: Location;
  file: string;
}

export class ItBlock extends Node {
  name: string;
}

export class Expect extends Node {}

export class TestReconciler {
  stateForTestFile(file: string): TestReconcilationState;
  stateForTestAssertion(file: string, name: string): TestFileAssertionStatus | null;
  failedStatuses(): Array<TestFileAssertionStatus>;
  updateFileWithJestStatus(data): void;
}

export type TestReconcilationState = "Unknown" |
  "KnownSuccess" |
  "KnownFail";

export interface TestFileAssertionStatus {
  file: string;
  message: string;
  status: TestReconcilationState;
  assertions: Array<TestAssertionStatus>;
}

export interface TestAssertionStatus {
  title: string;
  status: TestReconcilationState;
  message: string;
  shortMessage?: string;
  terseMessage?: string;
  line?: number;
}

export interface JestFileResults {
  name: string;
  summary: string;
  message: string;
  status: "failed" | "passed";
  startTime: number;
  endTime: number;
  assertionResults: Array<JestAssertionResults>;
}

export interface JestAssertionResults {
  name: string;
  title: string;
  status: "failed" | "passed";
  failureMessages: string[];
}

export interface JestTotalResults {
  success: boolean;
  startTime: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  testResults: Array<JestFileResults>;
}
