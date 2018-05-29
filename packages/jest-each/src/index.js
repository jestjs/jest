/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import bind from './bind';
import arrayEach from './array';
import templateEach from './template';

const each = (...args: Array<mixed>) => {
  if (args.length > 1) {
    return templateEach(global)(...args);
  }

  return arrayEach(global)(...args);
};

each.withGlobal = g => (...args: Array<mixed>) => {
  if (args.length > 1) {
    return templateEach(g)(...args);
  }

  return arrayEach(g)(...args);
};

export {bind};

export default each;
