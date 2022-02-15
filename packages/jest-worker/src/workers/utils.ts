/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {deserialize, serialize} from 'v8';

type StringifiedMessage = {stringifiedMessage: Buffer};
type WorkerResponse = Array<unknown> | [unknown, StringifiedMessage];

export const stringify = (message: unknown): StringifiedMessage => {
  return {stringifiedMessage: serialize(message)};
};

const hasStringifiedMessage = (obj: unknown): obj is StringifiedMessage => {
  return obj != null && typeof obj === 'object' && 'stringifiedMessage' in obj;
};

export const parse = ([, re]: WorkerResponse): unknown => {
  if (hasStringifiedMessage(re)) {
    return deserialize(Buffer.from(re.stringifiedMessage));
  }

  return re;
};
