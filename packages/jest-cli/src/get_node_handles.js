/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ProjectConfig} from 'types/Config';

import {formatExecError} from 'jest-message-util';

// Inspired by https://github.com/mafintosh/why-is-node-running/blob/master/index.js
// Extracted as we want to format the result ourselves
export default function collectHandles(): () => Array<Error> {
  const activeHandles: Map<string, Error> = new Map();

  function initHook(asyncId, type) {
    const error = new Error(type);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, initHook);
    }

    if (error.stack.includes('Runtime.requireModule')) {
      activeHandles.set(asyncId, error);
    }
  }

  let hook;

  try {
    // $FlowFixMe: Node core module
    const asyncHooks = require('async_hooks');
    hook = asyncHooks.createHook({
      destroy(asyncId) {
        activeHandles.delete(asyncId);
      },
      init: initHook,
    });

    hook.enable();
  } catch (e) {
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (e.code === 'MODULE_NOT_FOUND' && nodeMajor < 8) {
      throw new Error(
        'You can only use --detectOpenHandles on Node 8 and newer.',
      );
    } else {
      throw e;
    }
  }

  return () => {
    hook.disable();

    const result = Array.from(activeHandles.values());
    activeHandles.clear();
    return result;
  };
}

export function formatHandleErrors(
  errors: Array<Error>,
  config: ProjectConfig,
): Array<string> {
  return errors.map(err =>
    formatExecError(err, config, {noStackTrace: false}, undefined, true),
  );
}
