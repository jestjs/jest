/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type PageModule = {
  page: {
    screenshot?: unknown;
    cleanup?: () => void;
    extend: (api: Record<PropertyKey, unknown>) => void;
    elementLocator: (element: HTMLElement) => {
      click: () => Promise<unknown>;
      element: () => HTMLElement;
    };
    [key: string]: unknown;
  };
};

function loadPage() {
  const mod = require('../client/tester/context') as PageModule;
  return mod.page;
}

describe('page.extend', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('page.extend() adds methods to page object', () => {
    const page = loadPage();
    const render = jest.fn(() => 'rendered');

    page.extend({render});

    expect(typeof page.render).toBe('function');
    expect((page.render as () => string)()).toBe('rendered');
    expect(render).toHaveBeenCalledTimes(1);
  });

  test('page.extend() preserves existing methods', () => {
    const page = loadPage();

    expect(typeof page.screenshot).toBe('function');
    const originalScreenshot = page.screenshot;

    page.extend({render: jest.fn()});

    expect(page.screenshot).toBe(originalScreenshot);
  });

  test('page.elementLocator() wraps DOM element', () => {
    const page = loadPage();
    const div = document.createElement('div');

    const locator = page.elementLocator(div);

    expect(typeof locator.click).toBe('function');
    expect(typeof locator.element).toBe('function');
    expect(locator.element()).toBe(div);
  });

  test('cleanup symbol registered via extend', () => {
    const page = loadPage();
    const cleanup = jest.fn();

    page.extend({[Symbol.for('jest:component-cleanup')]: cleanup});
    page.cleanup?.();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('multiple extend calls merge', () => {
    const page = loadPage();
    const a = jest.fn();
    const b = jest.fn();

    page.extend({a});
    page.extend({b});

    expect(page.a).toBe(a);
    expect(page.b).toBe(b);
  });
});
