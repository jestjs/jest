/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

export interface Options {
  createProcess?(
    workspace: ProjectWorkspace, 
    args: string[], 
    debugPort?: number,
  ): ChildProcess;
  debugPort?: number;
  testNamePattern?: string;
  testFileNamePattern?: string;
}

export class Runner extends EventEmitter {
  constructor(workspace: ProjectWorkspace, options?: Options);
  watchMode: boolean;
  start(watchMode?: boolean): void;
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
    localJestMajorVersin: number,
  );
  pathToJest: string;
  pathToConfig: string;
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
  assertionsForTestFile(file: string): TestAssertionStatus[] | null;
  stateForTestAssertion(
    file: string,
    name: string,
  ): TestFileAssertionStatus | null;
  updateFileWithJestStatus(data: any): TestFileAssertionStatus[];
}

export type TestReconcilationState =
  | 'Unknown'
  | 'KnownSuccess'
  | 'KnownFail'
  | 'KnownSkip';

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
  status: 'failed' | 'passed';
  startTime: number;
  endTime: number;
  assertionResults: Array<JestAssertionResults>;
}

export interface JestAssertionResults {
  name: string;
  title: string;
  status: 'failed' | 'passed';
  failureMessages: string[];
  fullName: string;
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
