/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @type ./empty.d.ts
 */

import {expectType} from 'mlh-tsd';
//eslint-disable-next-line import/no-extraneous-dependencies
import {afterAll, afterEach, beforeAll, beforeEach} from '@jest/globals';

const fn = () => {};
const timeout = 5;

// https://jestjs.io/docs/en/api#methods
expectType<void>(afterAll(fn));
expectType<void>(afterAll(fn, timeout));
expectType<void>(afterEach(fn));
expectType<void>(afterEach(fn, timeout));
expectType<void>(beforeAll(fn));
expectType<void>(beforeAll(fn, timeout));
expectType<void>(beforeEach(fn));
expectType<void>(beforeEach(fn, timeout));
