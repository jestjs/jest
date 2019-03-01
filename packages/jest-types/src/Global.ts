/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CoverageMapData} from 'istanbul-lib-coverage';

export type DoneFn = (reason?: string | Error) => void;
export type TestName = string;
export type TestFn = (done?: DoneFn) => Promise<any> | void | undefined;
export type BlockFn = () => void;
export type BlockName = string;

// TODO: Get rid of this at some point
type JasmineType = {_DEFAULT_TIMEOUT_INTERVAL?: number; addMatchers: Function};

// TODO Replace with actual type when `jest-each` is ready
type Each = () => void;

export interface ItBase {
  (testName: TestName, fn: TestFn, timeout?: number): void;
  each: Each;
}

export interface It extends ItBase {
  only: ItBase;
  skip: ItBase;
  todo: (testName: TestName, ...rest: Array<any>) => void;
}

export interface ItConcurrentBase {
  (testName: string, testFn: () => Promise<any>, timeout?: number): void;
}

export interface ItConcurrentExtended extends ItConcurrentBase {
  only: ItConcurrentBase;
  skip: ItConcurrentBase;
}

export interface ItConcurrent extends It {
  concurrent: ItConcurrentExtended;
}

export interface DescribeBase {
  (blockName: BlockName, blockFn: BlockFn): void;
  each: Each;
}

export interface Describe extends DescribeBase {
  only: ItBase;
  skip: ItBase;
}

// TODO: Maybe add `| Window` in the future?
export interface Global extends NodeJS.Global {
  it: It;
  test: ItConcurrent;
  fit: ItBase;
  xit: ItBase;
  xtest: ItBase;
  describe: Describe;
  xdescribe: DescribeBase;
  fdescribe: DescribeBase;
  __coverage__: CoverageMapData;
  jasmine: JasmineType;
}

declare global {
  namespace jest {
    interface _Global extends Global {}
  }
  module NodeJS {
    interface Global {
      it: It;
      test: ItConcurrent;
      fit: ItBase;
      xit: ItBase;
      xtest: ItBase;
      describe: Describe;
      xdescribe: DescribeBase;
      fdescribe: DescribeBase;
    }
  }
}
