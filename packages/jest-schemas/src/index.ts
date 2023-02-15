/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Static, Type} from '@sinclair/typebox';

const RawSnapshotFormat = Type.Partial(
  Type.Object({
    callToJSON: Type.Readonly(Type.Boolean()),
    compareKeys: Type.Readonly(Type.Null()),
    escapeRegex: Type.Readonly(Type.Boolean()),
    escapeString: Type.Readonly(Type.Boolean()),
    highlight: Type.Readonly(Type.Boolean()),
    indent: Type.Readonly(Type.Number({minimum: 0})),
    maxDepth: Type.Readonly(Type.Number({minimum: 0})),
    maxWidth: Type.Readonly(Type.Number({minimum: 0})),
    min: Type.Readonly(Type.Boolean()),
    printBasicPrototype: Type.Readonly(Type.Boolean()),
    printFunctionName: Type.Readonly(Type.Boolean()),
    theme: Type.Readonly(
      Type.Partial(
        Type.Object({
          comment: Type.Readonly(Type.String()),
          content: Type.Readonly(Type.String()),
          prop: Type.Readonly(Type.String()),
          tag: Type.Readonly(Type.String()),
          value: Type.Readonly(Type.String()),
        }),
      ),
    ),
  }),
);

export const SnapshotFormat = Type.Strict(RawSnapshotFormat);
export type SnapshotFormat = Static<typeof RawSnapshotFormat>;
