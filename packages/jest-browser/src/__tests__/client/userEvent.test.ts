/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type UserEventModule = {
  createUserEvent: (
    sessionId: string,
    testPath: string,
    triggerCommand: (
      session: string,
      command: string,
      path: string,
      payload: Array<unknown>,
    ) => Promise<unknown>,
  ) => {
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
    type: (
      selector: string,
      text: string,
      options?: unknown,
    ) => Promise<unknown>;
    unhover: (selector: string, options?: unknown) => Promise<unknown>;
  };
};

type TriggerCommandFn = (
  session: string,
  command: string,
  path: string,
  payload: Array<unknown>,
) => Promise<unknown>;

function loadModule(): UserEventModule {
  return require('../../client/tester/context') as UserEventModule;
}

describe('createUserEvent', () => {
  const sessionId = 'session-user-event';
  const testPath = '/repo/browser/user-event.test.ts';

  function createTriggerCommandMock(
    result: unknown,
  ): jest.MockedFunction<TriggerCommandFn> {
    return jest.fn(async () => result);
  }

  test('click dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-click');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.click('#submit', {button: 'left'});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.click',
      testPath,
      ['#submit', {button: 'left'}],
    );
    expect(result).toBe('ok-click');
  });

  test('dblClick dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-dblClick');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.dblClick('[data-testid="row"]', {delay: 10});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.dblClick',
      testPath,
      ['[data-testid="row"]', {delay: 10}],
    );
    expect(result).toBe('ok-dblClick');
  });

  test('type dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-type');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.type('#name', 'Anh', {delay: 5});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.type',
      testPath,
      ['#name', 'Anh', {delay: 5}],
    );
    expect(result).toBe('ok-type');
  });

  test('clear dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-clear');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.clear('#search', {timeout: 500});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.clear',
      testPath,
      ['#search', {timeout: 500}],
    );
    expect(result).toBe('ok-clear');
  });

  test('fill dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-fill');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.fill('#email', 'a@b.com', {force: true});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.fill',
      testPath,
      ['#email', 'a@b.com', {force: true}],
    );
    expect(result).toBe('ok-fill');
  });

  test('hover dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-hover');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.hover('.menu-item', {position: 'center'});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.hover',
      testPath,
      ['.menu-item', {position: 'center'}],
    );
    expect(result).toBe('ok-hover');
  });

  test('unhover dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-unhover');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.unhover('.menu-item', {timeout: 800});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.unhover',
      testPath,
      ['.menu-item', {timeout: 800}],
    );
    expect(result).toBe('ok-unhover');
  });

  test('tab dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-tab');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.tab({shift: true});

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.tab',
      testPath,
      [{shift: true}],
    );
    expect(result).toBe('ok-tab');
  });

  test('selectOptions dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-selectOptions');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.selectOptions('#country', ['vn', 'jp'], {
      timeout: 600,
    });

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.selectOptions',
      testPath,
      ['#country', ['vn', 'jp'], {timeout: 600}],
    );
    expect(result).toBe('ok-selectOptions');
  });

  test('keyboard dispatches triggerCommand with command + args', async () => {
    const {createUserEvent} = loadModule();
    const triggerCommand = createTriggerCommandMock('ok-keyboard');
    const userEvent = createUserEvent(sessionId, testPath, triggerCommand);

    const result = await userEvent.keyboard('{Control>}a{/Control}', {
      delay: 1,
    });

    expect(triggerCommand).toHaveBeenCalledWith(
      sessionId,
      'userEvent.keyboard',
      testPath,
      ['{Control>}a{/Control}', {delay: 1}],
    );
    expect(result).toBe('ok-keyboard');
  });
});
