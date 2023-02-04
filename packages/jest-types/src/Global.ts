/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {CoverageMapData} from 'istanbul-lib-coverage';

export type ValidTestReturnValues = void | undefined;
type TestReturnValuePromise = Promise<unknown>;
type TestReturnValueGenerator = Generator<void, unknown, void>;
export type TestReturnValue = ValidTestReturnValues | TestReturnValuePromise;

export type TestContext = Record<string, unknown>;

export type DoneFn = (reason?: string | Error) => void;

export type DoneTakingTestFn = (
  this: TestContext,
  done: DoneFn,
) => ValidTestReturnValues;
export type PromiseReturningTestFn = (this: TestContext) => TestReturnValue;
export type GeneratorReturningTestFn = (
  this: TestContext,
) => TestReturnValueGenerator;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NameLike = number | Function;

export type TestName = string;
export type TestNameLike = TestName | NameLike;
export type TestFn =
  | PromiseReturningTestFn
  | GeneratorReturningTestFn
  | DoneTakingTestFn;
export type ConcurrentTestFn = () => TestReturnValuePromise;
export type BlockFn = () => void;
export type BlockName = string;
export type BlockNameLike = BlockName | NameLike;

export type HookFn = TestFn;

export type Col = unknown;
export type Row = ReadonlyArray<Col>;
export type Table = ReadonlyArray<Row>;
export type ArrayTable = Table | Row;
export type TemplateTable = TemplateStringsArray;
export type TemplateData = ReadonlyArray<unknown>;
export type EachTable = ArrayTable | TemplateTable;

export type TestCallback = BlockFn | TestFn | ConcurrentTestFn;

export type EachTestFn<EachCallback extends TestCallback> = (
  ...args: ReadonlyArray<any>
) => ReturnType<EachCallback>;

type TTimesNRecursive<
  T,
  N extends number,
  Result extends Array<T>,
> = Result['length'] extends N
  ? Result
  : TTimesNRecursive<T, N, [...Result, T]>;

// TTimesN<string, 3> = [string, string, string]
type TTimesN<T, N extends number> = TTimesNRecursive<T, N, []>;

/*
 * Flat2DTuple<[[string, boolean], [number, undefined]]> =
 * [string, boolean, number, undefined]
 */
type Flat2DTuple<S extends Array<Array<unknown>>> = S['length'] extends 0
  ? []
  : S extends [
      infer T extends Array<unknown>,
      ...infer Remaining extends Array<Array<unknown>>,
    ]
  ? [...T, ...Flat2DTuple<Remaining>]
  : never;

/*
 * TupleTimesN<[string, number], 3> =
 * [string, number, string, number, string, number]
 */
type TupleTimesN<T extends Array<unknown>, N extends number> = Flat2DTuple<
  TTimesN<T, N>
>;

type KeyTypePair = [string, unknown];

// EachArg<[['a', string], ['b', number]]> = {a: string, b: number}
type EachArg<T extends Array<KeyTypePair>> = {
  readonly [key in T[number][0]]: Extract<T[number], [key, unknown]>[1];
};

/*
 * KeyTypePairsToTypeTuple<[['a', string], ['b', number], ['c', boolean]]> =
 * [string, number, boolean]
 */
type KeyTypePairsToTypeTuple<T extends Array<KeyTypePair>> = {
  [i in keyof T]: T[i][1];
};

/* EachExpressions<[['a', string], ['b', number]], 3> =
 * [string, number, string, number, string, number]
 */
type EachExpressions<
  T extends Array<KeyTypePair>,
  N extends number,
> = TupleTimesN<KeyTypePairsToTypeTuple<T>, N>;

interface Each<EachFn extends TestFn | BlockFn> {
  // when the table is an array of object literals
  <T extends Record<string, unknown>>(table: ReadonlyArray<T>): (
    name: string | NameLike,
    fn: (arg: T, done: DoneFn) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is an array of tuples
  <T extends readonly [unknown, ...Array<unknown>]>(table: ReadonlyArray<T>): (
    name: string | NameLike,
    fn: (...args: T) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is an array of arrays
  <T extends ReadonlyArray<unknown>>(table: ReadonlyArray<T>): (
    name: string | NameLike,
    fn: (...args: T) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is a tuple or array
  <T>(table: ReadonlyArray<T>): (
    name: string | NameLike,
    fn: (arg: T, done: DoneFn) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is a template literal
  <T = unknown>(strings: TemplateStringsArray, ...expressions: Array<T>): (
    name: string | NameLike,
    fn: (arg: Record<string, T>, done: DoneFn) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is a template literal with a type argument
  <T extends Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...expressions: Array<unknown>
  ): (
    name: string | NameLike,
    fn: (arg: T, done: DoneFn) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;

  // when the table is a template literal with types for table and test function
  <T extends Array<KeyTypePair>, N extends number>(
    strings: TemplateStringsArray,
    ...expressions: EachExpressions<T, N>
  ): (
    name: string | NameLike,
    fn: (arg: EachArg<T>, done: DoneFn) => ReturnType<EachFn>,
    timeout?: number,
  ) => void;
}

export interface HookBase {
  (fn: HookFn, timeout?: number): void;
}

export interface Failing<T extends TestFn> {
  (testName: TestNameLike, fn: T, timeout?: number): void;
  each: Each<T>;
}

export interface ItBase {
  (testName: TestNameLike, fn: TestFn, timeout?: number): void;
  each: Each<TestFn>;
  failing: Failing<TestFn>;
}

export interface It extends ItBase {
  only: ItBase;
  skip: ItBase;
  todo: (testName: TestNameLike) => void;
}

export interface ItConcurrentBase {
  (testName: TestNameLike, testFn: ConcurrentTestFn, timeout?: number): void;
  each: Each<ConcurrentTestFn>;
  failing: Failing<ConcurrentTestFn>;
}

export interface ItConcurrentExtended extends ItConcurrentBase {
  only: ItConcurrentBase;
  skip: ItConcurrentBase;
}

export interface ItConcurrent extends It {
  concurrent: ItConcurrentExtended;
}

export interface DescribeBase {
  (blockName: BlockNameLike, blockFn: BlockFn): void;
  each: Each<BlockFn>;
}

export interface Describe extends DescribeBase {
  only: DescribeBase;
  skip: DescribeBase;
}

export interface TestFrameworkGlobals {
  it: ItConcurrent;
  test: ItConcurrent;
  fit: ItBase & {concurrent?: ItConcurrentBase};
  xit: ItBase;
  xtest: ItBase;
  describe: Describe;
  xdescribe: DescribeBase;
  fdescribe: DescribeBase;
  beforeAll: HookBase;
  beforeEach: HookBase;
  afterEach: HookBase;
  afterAll: HookBase;
}

export interface GlobalAdditions extends TestFrameworkGlobals {
  __coverage__: CoverageMapData;
}

export interface Global
  extends GlobalAdditions,
    Omit<typeof globalThis, keyof GlobalAdditions> {
  [extras: PropertyKey]: unknown;
}
