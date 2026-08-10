/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
  createScriptTransformer,
  createTranspilingRequire,
} from './ScriptTransformer';
export type {TransformerType as ScriptTransformer} from './ScriptTransformer';
export {default as shouldInstrument} from './shouldInstrument';
export type {
  CallerTransformOptions,
  Transformer,
  SyncTransformer,
  AsyncTransformer,
  ShouldInstrumentOptions,
  Options as TransformationOptions,
  TransformerCreator,
  TransformOptions,
  TransformResult,
  TransformedSource,
  TransformerFactory,
} from './types';
export {default as handlePotentialSyntaxError} from './enhanceUnexpectedTokenMessage';
