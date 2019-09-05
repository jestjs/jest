/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Gets moved to jest-circus/runner during build (yarn build)
// to allow people to import using `jest-circus/runner`.

import runner from './legacy-code-todo-rewrite/jestAdapter';

export default runner;
export * from './state';
export {default as run} from './run';
