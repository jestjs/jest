/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {version as VERSION} from '../package.json';

export {default as SearchSource} from './SearchSource';
export {default as TestScheduler} from './TestScheduler';
export {default as TestWatcher} from './TestWatcher';
export {run, runCLI} from './cli';

export const getVersion = () => VERSION;
