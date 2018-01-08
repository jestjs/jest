/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

import {printObjectProperties} from '../collections';

const SPACE = ' ';

const COLLECTION_NAMES = ['DOMStringMap', 'NamedNodeMap'];

export const test = (val: any) =>
  val &&
  val.constructor &&
  COLLECTION_NAMES.indexOf(val.constructor.name) !== -1;

const convertCollectionToObject = (collection: any) => {
  let result = {};

  if (collection.constructor.name === 'NamedNodeMap') {
    for (let i = 0; i < collection.length; i++) {
      result[collection[i].name] = collection[i].value;
    }
  } else {
    result = Object.assign({}, collection);
  }

  return result;
};

export const serialize = (
  collection: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  if (++depth > config.maxDepth) {
    return '[' + collection.constructor.name + ']';
  }

  return (
    collection.constructor.name +
    SPACE +
    '{' +
    printObjectProperties(
      convertCollectionToObject(collection),
      config,
      indentation,
      depth,
      refs,
      printer,
    ) +
    '}'
  );
};

export default ({serialize, test}: NewPlugin);
