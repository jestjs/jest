/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createPage} from './page';

type SessionTriggerCommand = (
  sessionId: string,
  command: string,
  testPath: string,
  payload: Array<unknown>,
) => Promise<unknown>;

type DirectTriggerCommand = (...args: Array<unknown>) => unknown;

function createSessionUserEvent(
  sessionId: string,
  testPath: string,
  triggerCommand: SessionTriggerCommand,
): {
  clear: (selector: string, options?: unknown) => Promise<unknown>;
  click: (selector: string, options?: unknown) => Promise<unknown>;
  dblClick: (selector: string, options?: unknown) => Promise<unknown>;
  fill: (
    selector: string,
    value: string,
    options?: unknown,
  ) => Promise<unknown>;
  hover: (selector: string, options?: unknown) => Promise<unknown>;
  keyboard: (text: string, options?: unknown) => Promise<unknown>;
  selectOptions: (
    selector: string,
    values: string | Array<string>,
    options?: unknown,
  ) => Promise<unknown>;
  tab: (options?: unknown) => Promise<unknown>;
  type: (selector: string, text: string, options?: unknown) => Promise<unknown>;
  unhover: (selector: string, options?: unknown) => Promise<unknown>;
} {
  return {
    clear: (selector: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.clear', testPath, [
        selector,
        options,
      ]),
    click: (selector: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.click', testPath, [
        selector,
        options,
      ]),
    dblClick: (selector: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.dblClick', testPath, [
        selector,
        options,
      ]),
    fill: (selector: string, value: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.fill', testPath, [
        selector,
        value,
        options,
      ]),
    hover: (selector: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.hover', testPath, [
        selector,
        options,
      ]),
    keyboard: (text: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.keyboard', testPath, [
        text,
        options,
      ]),
    selectOptions: (
      selector: string,
      values: string | Array<string>,
      options?: unknown,
    ) =>
      triggerCommand(sessionId, 'userEvent.selectOptions', testPath, [
        selector,
        values,
        options,
      ]),
    tab: (options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.tab', testPath, [options]),
    type: (selector: string, text: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.type', testPath, [
        selector,
        text,
        options,
      ]),
    unhover: (selector: string, options?: unknown) =>
      triggerCommand(sessionId, 'userEvent.unhover', testPath, [
        selector,
        options,
      ]),
  };
}

function createDirectUserEvent(triggerCommand: DirectTriggerCommand): {
  clear: (el: unknown, opts?: unknown) => Promise<unknown>;
  click: (el: unknown, opts?: unknown) => Promise<unknown>;
  dblClick: (el: unknown, opts?: unknown) => Promise<unknown>;
  fill: (el: unknown, text: string, opts?: unknown) => Promise<unknown>;
  hover: (el: unknown, opts?: unknown) => Promise<unknown>;
  keyboard: (text: string) => Promise<unknown>;
  selectOptions: (
    el: unknown,
    values: unknown,
    opts?: unknown,
  ) => Promise<unknown>;
  tab: (opts?: unknown) => Promise<unknown>;
  type: (el: unknown, text: string, opts?: unknown) => Promise<unknown>;
  unhover: (el: unknown, opts?: unknown) => Promise<unknown>;
} {
  const run = (...args: Array<unknown>): Promise<unknown> =>
    Promise.resolve(triggerCommand(...args));

  return {
    clear: (el: unknown, opts?: unknown) => run('__clear', el, opts),
    click: (el: unknown, opts?: unknown) => run('__click', el, opts),
    dblClick: (el: unknown, opts?: unknown) => run('__dblClick', el, opts),
    fill: (el: unknown, text: string, opts?: unknown) =>
      run('__fill', el, text, opts),
    hover: (el: unknown, opts?: unknown) => run('__hover', el, opts),
    keyboard: (text: string) => run('__keyboard', text),
    selectOptions: (el: unknown, values: unknown, opts?: unknown) =>
      run('__selectOptions', el, values, opts),
    tab: (opts?: unknown) => run('__tab', opts),
    type: (el: unknown, text: string, opts?: unknown) =>
      run('__type', el, text, opts),
    unhover: (el: unknown, opts?: unknown) => run('__unhover', el, opts),
  };
}

export function createUserEvent(
  sessionIdOrTriggerCommand: string | DirectTriggerCommand,
  testPath?: string,
  triggerCommand?: SessionTriggerCommand,
):
  | ReturnType<typeof createSessionUserEvent>
  | ReturnType<typeof createDirectUserEvent> {
  if (typeof sessionIdOrTriggerCommand === 'function') {
    return createDirectUserEvent(sessionIdOrTriggerCommand);
  }

  if (typeof triggerCommand !== 'function' || typeof testPath !== 'string') {
    throw new TypeError(
      'createUserEvent requires sessionId, testPath, and triggerCommand',
    );
  }

  return createSessionUserEvent(
    sessionIdOrTriggerCommand,
    testPath,
    triggerCommand,
  );
}

export {createPage};

export const page = createPage(async () => undefined);
