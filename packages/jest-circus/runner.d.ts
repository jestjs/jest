import adapter = require('./build/legacy-code-todo-rewrite/jestAdapter');
import * as circusState from './build/state';
import circusRun from './build/run';

declare namespace jestCircusRunner {
  export const state = circusState;
  export const run = circusRun;
}

export = jestCircusRunner;
