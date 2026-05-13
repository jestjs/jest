/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {BrowserCommand} from '@jest/browser';

async function click(
  {page}: {page: any},
  selector: string,
  options?: Record<string, unknown>,
): Promise<void> {
  await page.click(selector, options);
}

async function dblClick(
  {page}: {page: any},
  selector: string,
  options?: Record<string, unknown>,
): Promise<void> {
  await page.dblclick(selector, options);
}

async function type(
  {page}: {page: any},
  selector: string,
  text: string,
): Promise<void> {
  await page.type(selector, text);
}

async function fill(
  {page}: {page: any},
  selector: string,
  value: string,
): Promise<void> {
  await page.fill(selector, value);
}

async function clear({page}: {page: any}, selector: string): Promise<void> {
  await page.fill(selector, '');
}

async function hover({page}: {page: any}, selector: string): Promise<void> {
  await page.hover(selector);
}

async function unhover({page}: {page: any}): Promise<void> {
  await page.mouse.move(0, 0);
}

async function tab({page}: {page: any}): Promise<void> {
  await page.keyboard.press('Tab');
}

async function keyboard({page}: {page: any}, text: string): Promise<void> {
  await page.keyboard.type(text);
}

async function selectOptions(
  {page}: {page: any},
  selector: string,
  values: string | Array<string>,
): Promise<void> {
  await page.selectOption(selector, values);
}

export const playwrightCommands: Record<string, BrowserCommand> = {
  __clear: clear,
  __click: click,
  __dblClick: dblClick,
  __fill: fill,
  __hover: hover,
  __jest_clear: clear,
  __jest_click: click,
  __jest_dblClick: dblClick,
  __jest_fill: fill,
  __jest_hover: hover,
  __jest_keyboard: keyboard,
  __jest_selectOptions: selectOptions,
  __jest_tab: tab,
  __jest_type: type,
  __jest_unhover: unhover,
  __keyboard: keyboard,
  __selectOptions: selectOptions,
  __tab: tab,
  __type: type,
  __unhover: unhover,
};
