/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type SerializedRecord,
  deserialize,
  serialize,
} from '@ungap/structured-clone';

type TransferringContainer = {
  __STRUCTURED_CLONE_SERIALIZED__: true;
  data: SerializedRecord;
};

export function packMessage(message: unknown): TransferringContainer {
  return {
    __STRUCTURED_CLONE_SERIALIZED__: true,
    /**
     * Use the `json: true` option to avoid errors
     * caused by `function` or `symbol` types.
     * It's not ideal to lose `function` and `symbol` types,
     * but reliability is more important.
     */
    data: serialize(message, {json: true}),
  };
}

function isTransferringContainer(
  message: unknown,
): message is TransferringContainer {
  return (
    message != null &&
    typeof message === 'object' &&
    '__STRUCTURED_CLONE_SERIALIZED__' in message &&
    'data' in message
  );
}

export function unpackMessage(message: unknown): unknown {
  if (isTransferringContainer(message)) {
    return deserialize(message.data);
  }
  return message;
}
