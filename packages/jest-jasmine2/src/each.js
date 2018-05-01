/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Environment} from 'types/Environment';

import util from 'util';
import chalk from 'chalk';
import pretty from 'pretty-format';

type Table = Array<Array<any>>;

const EXPECTED_COLOR = chalk.green;
const RECEIVED_COLOR = chalk.red;

export default (environment: Environment): void => {
  environment.global.it.each = bindEach(environment.global.it);
  environment.global.fit.each = bindEach(environment.global.fit);
  environment.global.xit.each = bindEach(environment.global.xit);
  environment.global.describe.each = bindEach(environment.global.describe);
  environment.global.xdescribe.each = bindEach(environment.global.xdescribe);
  environment.global.fdescribe.each = bindEach(environment.global.fdescribe);
};

const bindEach = (cb: Function) => (...args: any) => (
  title: string,
  test: Function,
): void => {
  if (args.length === 1) {
    const table: Table = args[0];
    return table.forEach(row =>
      cb(util.format(title, ...row), applyRestParams(row, test)),
    );
  }

  const templateStrings = args[0];
  const data = args.slice(1);

  const keys = getHeadingKeys(templateStrings[0]);
  const table = buildTable(data, keys.length, keys);

  if (data.length % keys.length !== 0) {
    return cb(title, () => {
      throw new Error(
        'Not enough arguments supplied for given headings:\n' +
          EXPECTED_COLOR(keys.join(' | ')) +
          '\n\n' +
          'Received:\n' +
          RECEIVED_COLOR(pretty(data)) +
          '\n\n' +
          `Missing ${RECEIVED_COLOR(`${data.length % keys.length}`)} arguments`,
      );
    });
  }

  return table.forEach(row =>
    cb(interpolate(title, row), applyObjectParams(row, test)),
  );
};

const applyRestParams = (params: Array<any>, test: Function) => {
  if (params.length < test.length) return done => test(...params, done);

  return () => test(...params);
};

const getHeadingKeys = (headings: string): Array<string> =>
  headings.replace(/\s/g, '').split('|');

const buildTable = (
  data: Array<any>,
  rowSize: number,
  keys: Array<string>,
): Array<any> =>
  Array.from({length: data.length / rowSize})
    .map((_, index) => data.slice(index * rowSize, index * rowSize + rowSize))
    .map(row =>
      row.reduce(
        (acc, value, index) => Object.assign({}, acc, {[keys[index]]: value}),
        {},
      ),
    );

const interpolate = (title: string, data: any) =>
  Object.keys(data).reduce(
    (acc, key) => acc.replace('$' + key, data[key]),
    title,
  );

const applyObjectParams = (obj: any, test: Function) => {
  if (test.length > 1) return done => test(obj, done);

  return () => test(obj);
};
