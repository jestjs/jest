/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {printListItems, printObjectProperties} from '../collections';
import type {Config, NewPlugin, Printer, Refs} from '../types';

const SPACE = ' ';

const OBJECT_NAMES = ['DOMStringMap', 'NamedNodeMap'];
const ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/;

const testName = (name: any) =>
  OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name);

export const test: NewPlugin['test'] = (val: object) =>
  val &&
  val.constructor &&
  !!val.constructor.name &&
  testName(val.constructor.name);

const isNamedNodeMap = (collection: object): collection is NamedNodeMap =>
  collection.constructor.name === 'NamedNodeMap';

export const serialize: NewPlugin['serialize'] = (
  collection: any | NamedNodeMap,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) => {
  const name = collection.constructor.name;
  if (++depth > config.maxDepth) {
    return `[${name}]`;
  }

  return (
    (config.min ? '' : name + SPACE) +
    (OBJECT_NAMES.indexOf(name) !== -1
      ? `{${printObjectProperties(
          isNamedNodeMap(collection)
            ? Array.from(collection).reduce<Record<string, string>>(
                (props, attribute) => {
                  props[attribute.name] = attribute.value;
                  return props;
                },
                {},
              )
            : {...collection},
          config,
          indentation,
          depth,
          refs,
          printer,
        )}}`
      : `[${printListItems(
          Array.from(collection),
          config,
          indentation,
          depth,
          refs,
          printer,
        )}]`)
  );
};

const plugin: NewPlugin = {serialize, test};

export default plugin;
