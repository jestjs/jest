/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
