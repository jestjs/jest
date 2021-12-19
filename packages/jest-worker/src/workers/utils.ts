/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as flatted from 'flatted';

type StringifiedMessage = {stringifiedMessage: string};
type WorkerResponse = Array<unknown> | [unknown, StringifiedMessage];

export const stringify = (message: unknown): StringifiedMessage => {
  return {stringifiedMessage: flatted.stringify(message)};
};

const hasStringifiedMessage = (obj: unknown): obj is StringifiedMessage => {
  return typeof obj === 'object' && !!obj && 'stringifiedMessage' in obj;
};

export const parse = ([, re]: WorkerResponse): unknown => {
  if (hasStringifiedMessage(re)) {
    return flatted.parse(re.stringifiedMessage);
  }

  return re;
};
