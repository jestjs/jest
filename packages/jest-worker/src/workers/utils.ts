/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as v8 from 'v8';

type SerializedMessage = {serializedMessage: Buffer};
type WorkerResponse = Array<unknown> | [unknown, SerializedMessage];

export const serialize = (message: unknown): SerializedMessage => {
  return {serializedMessage: v8.serialize(message)};
};

function hasSerializedMessage(obj: unknown): obj is SerializedMessage {
  return obj != null && typeof obj === 'object' && 'serializedMessage' in obj;
}

export const deserialize = ([, re]: WorkerResponse): unknown => {
  if (hasSerializedMessage(re)) {
    return v8.deserialize(Buffer.from(re.serializedMessage));
  }

  return re;
};
