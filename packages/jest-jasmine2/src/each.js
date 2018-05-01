import type {Environment} from 'types/Environment';

import {vsprintf} from 'sprintf-js';

type Table = Array<Array<Any>>;

export default (environment: Environment): void => {
  environment.global.it.each = bindEach(environment.global.it);
  environment.global.fit.each = bindEach(environment.global.fit);
  environment.global.xit.each = bindEach(environment.global.xit);
  environment.global.describe.each = bindEach(environment.global.describe);
  environment.global.xdescribe.each = bindEach(environment.global.xdescribe);
  environment.global.fdescribe.each = bindEach(environment.global.fdescribe);
};

const bindEach = (cb: Function) => (table: Table) => (
  title: string,
  test: Function,
): void => {
  table.forEach(row => cb(vsprintf(title, row), applyRestParams(row, test)));
};

const applyRestParams = (params: Array<any>, test: Function) => {
  if (params.length < test.length) return done => test(...params, done);

  return () => test(...params);
};
