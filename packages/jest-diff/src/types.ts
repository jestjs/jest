/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type DiffOptionsColor = (arg: string) => string; // subset of Chalk type

export type DiffOptions = {
  aAnnotation?: string;
  aColor?: DiffOptionsColor;
  aSymbol?: string;
  bAnnotation?: string;
  bColor?: DiffOptionsColor;
  bSymbol?: string;
  commonColor?: DiffOptionsColor;
  commonSymbol?: string;
  contextLines?: number;
  expand?: boolean;
  omitAnnotationLines?: boolean;
};

export type DiffOptionsNormalized = {
  aAnnotation: string;
  aColor: DiffOptionsColor;
  aSymbol: string;
  bAnnotation: string;
  bColor: DiffOptionsColor;
  bSymbol: string;
  commonColor: DiffOptionsColor;
  commonSymbol: string;
  contextLines: number;
  expand: boolean;
  omitAnnotationLines: boolean;
};
