/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import {ChildProcess} from 'child_process';

export interface SpawnOptions {
  shell?: boolean;
}

export interface Options {
  createProcess?(
    workspace: ProjectWorkspace,
    args: string[],
    options?: SpawnOptions,
  ): ChildProcess;
  noColor?: boolean;
  testNamePattern?: string;
  testFileNamePattern?: string;
  shell?: boolean;
}

export class Runner extends EventEmitter {
  constructor(workspace: ProjectWorkspace, options?: Options);
  watchMode: boolean;
  watchAll: boolean;
  start(watchMode?: boolean, watchAll?: boolean): void;
  closeProcess(): void;
  runJestWithUpdateForSnapshots(completion: any): void;
}

export class Settings extends EventEmitter {
  constructor(workspace: ProjectWorkspace, options?: Options);
  getConfig(completed: Function): void;
  jestVersionMajor: number | null;
  settings: {
    testRegex: string,
    testMatch: string[],
  };
}

export class ProjectWorkspace {
  constructor(
    rootPath: string,
    pathToJest: string,
    pathToConfig: string,
    localJestMajorVersin: number,
    collectCoverage?: boolean,
    debug?: boolean,
  );
  pathToJest: string;
  pathToConfig: string;
  rootPath: string;
  localJestMajorVersion: number;
  collectCoverage?: boolean;
  debug?: boolean;
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

/**
 *  Did the thing pass, fail or was it not run?
 */
export type TestReconcilationState =
  | 'Unknown' // The file has not changed, so the watcher didn't hit it
  | 'KnownFail' // Definitely failed
  | 'KnownSuccess' // Definitely passed
  | 'KnownSkip'; // Definitely skipped

/**
 * The Jest Extension's version of a status for
 * whether the file passed or not
 *
 */
export interface TestFileAssertionStatus {
  file: string;
  message: string;
  status: TestReconcilationState;
  assertions: Array<TestAssertionStatus> | null;
}

/**
 * The Jest Extension's version of a status for
 * individual assertion fails
 *
 */
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
  coverageMap: any;
  testResults: Array<JestFileResults>;
}

export interface JestTotalResultsMeta {
  noTestsFound: boolean;
}

export enum messageTypes {
  noTests = 1,
  testResults = 3,
  unknown = 0,
  watchUsage = 2,
}

export type MessageType = number;

export interface SnapshotMetadata {
  exists: boolean;
  name: string;
  node: {
    loc: Node;
  };
  content?: string;
}

export class Snapshot {
  constructor(parser?: any, customMatchers?: string[]);
  getMetadata(filepath: string): SnapshotMetadata[];
}

type FormattedTestResults = {
  testResults: TestResult[]
}

type TestResult = {
  name: string
}