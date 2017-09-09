/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Location} from '../types';

export class Node {
  start: Location;
  end: Location;
  file: string;
}

export class Expect extends Node {}

export class ItBlock extends Node {
  name: string;
}
