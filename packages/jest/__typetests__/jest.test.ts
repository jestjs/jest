/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import type {Jest} from '@jest/environment';
import type {JestExpect} from '@jest/expect';
import type {Config as ConfigTypes, Global} from '@jest/types';
import type {Config} from 'jest';

// Config

declare const config: Config;

expectType<ConfigTypes.InitialOptions>(config);

// globals enable through "types": ["jest"]

expectType<Global.TestFrameworkGlobals['beforeEach']>(beforeEach);
expectType<Global.TestFrameworkGlobals['beforeAll']>(beforeAll);

expectType<Global.TestFrameworkGlobals['afterEach']>(afterEach);
expectType<Global.TestFrameworkGlobals['afterAll']>(afterAll);

expectType<Global.TestFrameworkGlobals['describe']>(describe);
expectType<Global.TestFrameworkGlobals['fdescribe']>(fdescribe);
expectType<Global.TestFrameworkGlobals['xdescribe']>(xdescribe);

expectType<Global.TestFrameworkGlobals['test']>(test);
expectType<Global.TestFrameworkGlobals['xtest']>(xtest);

expectType<Global.TestFrameworkGlobals['it']>(it);
expectType<Global.TestFrameworkGlobals['fit']>(fit);
expectType<Global.TestFrameworkGlobals['xit']>(xit);

expectType<JestExpect>(expect);

expectType<Jest>(jest);
