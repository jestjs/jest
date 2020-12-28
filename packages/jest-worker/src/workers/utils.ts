/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parse as parseMessage, stringify} from 'telejson';

const customMessageStarter = 'jest string - ';

export function serialize(data: unknown): unknown {
  if (data != null && typeof data === 'object') {
    // we only use stringify for the circular objects, not other features
    return `${customMessageStarter}${stringify(data, {
      allowClass: false,
      allowDate: false,
      allowFunction: false,
      allowRegExp: false,
      allowSymbol: false,
      allowUndefined: false,
    })}`;
  }

  return data;
}

export function parse(data: unknown): unknown {
  if (typeof data === 'string' && data.startsWith(customMessageStarter)) {
    return parseMessage(data.slice(customMessageStarter.length));
  }

  return data;
}
