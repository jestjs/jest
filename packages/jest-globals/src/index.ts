/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import importedExpect = require('expect');
import type {Jest} from '@jest/environment';
import type {Global} from '@jest/types';

export declare type jest = Jest;

export declare type expect = typeof importedExpect;

export declare type it = Global.GlobalAdditions['it'];
export declare type test = Global.GlobalAdditions['test'];
export declare type fit = Global.GlobalAdditions['fit'];
export declare type xit = Global.GlobalAdditions['xit'];
export declare type xtest = Global.GlobalAdditions['xtest'];
export declare type describe = Global.GlobalAdditions['describe'];
export declare type xdescribe = Global.GlobalAdditions['xdescribe'];
export declare type fdescribe = Global.GlobalAdditions['fdescribe'];

throw new Error(
  'Do not import `@jest/globals` outside of the Jest test environment',
);
