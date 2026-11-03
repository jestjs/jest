/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AsyncLocalStorage} from 'node:async_hooks';
import type {Global} from '@jest/types';
import {ErrorWithStack, isError} from 'jest-util';

// Tracks the chain of nested step titles for the async call stack currently
// executing. Scoped per async context, so concurrent tests (and concurrent
// steps within `describe.concurrent`-style usage) each see their own chain.
const stepPathStorage = new AsyncLocalStorage<Array<string>>();

// Marks an error as already carrying a step path, so a failure that
// propagates through several nested `step()` calls is only prefixed once,
// with the innermost (most specific) path.
const STEP_TAGGED = Symbol.for('jest-circus.stepTagged');

type TaggableError = Error & {[STEP_TAGGED]?: true};

const formatStepPath = (path: Array<string>): string => `"${path.join(' > ')}"`;

export type StepFn = Global.StepFn;

// Implements `test.step()` / `it.step()`: a named, possibly-nested unit of
// work inside a test body. A step doesn't produce its own pass/fail result —
// it only annotates an error thrown inside it with the path of step titles
// that were active when the error was thrown, so failures in long test
// bodies are easier to place.
export const step: Global.StepFn = async (title, fn) => {
  if (typeof title !== 'string') {
    throw new ErrorWithStack(
      `Invalid first argument, ${String(
        title,
      )}. It must be a string naming the step.`,
      step,
    );
  }

  if (typeof fn !== 'function') {
    throw new ErrorWithStack(
      `Invalid second argument, ${String(fn)}. It must be a callback function.`,
      step,
    );
  }

  const parentPath = stepPathStorage.getStore() ?? [];
  const path = [...parentPath, title];

  return stepPathStorage.run(path, async () => {
    try {
      return await fn();
    } catch (error) {
      if (isError(error) && (error as TaggableError)[STEP_TAGGED] !== true) {
        const taggedError = error as TaggableError;
        taggedError[STEP_TAGGED] = true;
        taggedError.message = `step ${formatStepPath(path)}: ${
          taggedError.message
        }`;
      }

      throw error;
    }
  });
};
