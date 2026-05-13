/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type MatcherResult = {
  message: () => string;
  pass: boolean;
};

type DomMatchersModule = {
  domMatchers: {
    toBeChecked: (received: unknown) => MatcherResult;
    toBeEnabled: (received: unknown) => MatcherResult;
    toBeInTheDocument: (received: unknown) => MatcherResult;
    toBeVisible: (received: unknown) => MatcherResult;
    toHaveAttribute: (
      received: unknown,
      name: unknown,
      value?: unknown,
    ) => MatcherResult;
    toHaveClass: (
      received: unknown,
      ...classNames: Array<unknown>
    ) => MatcherResult;
    toHaveFocus: (received: unknown) => MatcherResult;
    toHaveTextContent: (received: unknown, expected: unknown) => MatcherResult;
    toHaveValue: (received: unknown, expected?: unknown) => MatcherResult;
  };
};

type ExpectApi = {
  (actual: unknown): {
    not: Record<string, (...args: Array<unknown>) => void>;
  } & Record<string, (...args: Array<unknown>) => void>;
  extend: (
    extensions: Record<string, (...args: Array<unknown>) => MatcherResult>,
  ) => void;
};

type ExpectModule = {
  createExpect: () => ExpectApi;
};

function loadDomMatchers(): DomMatchersModule {
  return require('../../client/tester/dom-matchers') as DomMatchersModule;
}

function loadExpect(): ExpectModule {
  return require('../../client/tester/expect') as ExpectModule;
}

describe('domMatchers', () => {
  test('toBeInTheDocument passes for attached node, fails for detached node, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const attached = document.createElement('div');
    document.body.append(attached);
    const detached = document.createElement('div');

    expect(() => expectBrowser(attached).toBeInTheDocument()).not.toThrow();
    expect(() => expectBrowser(detached).toBeInTheDocument()).toThrow(
      'Expected element to be in document',
    );

    expect(() => expectBrowser(detached).not.toBeInTheDocument()).not.toThrow();
    expect(() => expectBrowser(attached).not.toBeInTheDocument()).toThrow(
      'Expected element to be in document',
    );
  });

  test('toBeVisible respects hidden/display/visibility/opacity, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const visible = document.createElement('button');
    const hiddenAttr = document.createElement('div');
    hiddenAttr.setAttribute('hidden', '');
    const hiddenStyle = document.createElement('div');
    hiddenStyle.style.display = 'none';
    const hiddenVisibility = document.createElement('div');
    hiddenVisibility.style.visibility = 'hidden';
    const zeroOpacity = document.createElement('div');
    zeroOpacity.style.opacity = '0';

    document.body.append(
      visible,
      hiddenAttr,
      hiddenStyle,
      hiddenVisibility,
      zeroOpacity,
    );

    expect(() => expectBrowser(visible).toBeVisible()).not.toThrow();
    expect(() => expectBrowser(hiddenAttr).toBeVisible()).toThrow(
      'Expected element to be visible',
    );
    expect(() => expectBrowser(hiddenStyle).toBeVisible()).toThrow(
      'Expected element to be visible',
    );
    expect(() => expectBrowser(hiddenVisibility).toBeVisible()).toThrow(
      'Expected element to be visible',
    );
    expect(() => expectBrowser(zeroOpacity).toBeVisible()).toThrow(
      'Expected element to be visible',
    );

    expect(() => expectBrowser(hiddenStyle).not.toBeVisible()).not.toThrow();
    expect(() => expectBrowser(visible).not.toBeVisible()).toThrow(
      'Expected element to be visible',
    );
  });

  test('toBeEnabled fails for disabled form controls, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const enabledInput = document.createElement('input');
    const disabledButton = document.createElement('button');
    disabledButton.disabled = true;
    document.body.append(enabledInput, disabledButton);

    expect(() => expectBrowser(enabledInput).toBeEnabled()).not.toThrow();
    expect(() => expectBrowser(disabledButton).toBeEnabled()).toThrow(
      'Expected element to be enabled',
    );

    expect(() => expectBrowser(disabledButton).not.toBeEnabled()).not.toThrow();
    expect(() => expectBrowser(enabledInput).not.toBeEnabled()).toThrow(
      'Expected element to be enabled',
    );
  });

  test('toHaveAttribute checks existence and value, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const node = document.createElement('a');
    node.setAttribute('href', '/docs');
    node.dataset.track = 'nav-link';
    document.body.append(node);

    expect(() => expectBrowser(node).toHaveAttribute('href')).not.toThrow();
    expect(() =>
      expectBrowser(node).toHaveAttribute('href', '/docs'),
    ).not.toThrow();
    expect(() => expectBrowser(node).toHaveAttribute('href', '/api')).toThrow(
      'Expected element to have attribute href with value /api',
    );
    expect(() => expectBrowser(node).toHaveAttribute('title')).toThrow(
      'Expected element to have attribute title',
    );

    expect(() =>
      expectBrowser(node).not.toHaveAttribute('title'),
    ).not.toThrow();
    expect(() => expectBrowser(node).not.toHaveAttribute('data-track')).toThrow(
      'Expected element to have attribute data-track',
    );
  });

  test('toHaveClass verifies multiple tokens, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const node = document.createElement('div');
    node.className = 'btn primary large';
    document.body.append(node);

    expect(() => expectBrowser(node).toHaveClass('btn')).not.toThrow();
    expect(() =>
      expectBrowser(node).toHaveClass('btn', 'primary'),
    ).not.toThrow();
    expect(() => expectBrowser(node).toHaveClass('missing')).toThrow(
      'Expected element to have requested classes',
    );

    expect(() => expectBrowser(node).not.toHaveClass('missing')).not.toThrow();
    expect(() => expectBrowser(node).not.toHaveClass('primary')).toThrow(
      'Expected element to have requested classes',
    );
  });

  test('toHaveTextContent matches text and regex, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const node = document.createElement('div');
    node.textContent = 'Hello Browser World';
    document.body.append(node);

    expect(() =>
      expectBrowser(node).toHaveTextContent('Browser'),
    ).not.toThrow();
    expect(() =>
      expectBrowser(node).toHaveTextContent(/hello browser/i),
    ).not.toThrow();
    expect(() => expectBrowser(node).toHaveTextContent('Missing')).toThrow(
      'Expected element to have matching text content',
    );

    expect(() =>
      expectBrowser(node).not.toHaveTextContent('Missing'),
    ).not.toThrow();
    expect(() => expectBrowser(node).not.toHaveTextContent('World')).toThrow(
      'Expected element to have matching text content',
    );
  });

  test('toHaveValue handles input/select values, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const input = document.createElement('input');
    input.value = 'abc-123';
    const select = document.createElement('select');
    const one = document.createElement('option');
    one.value = 'one';
    one.textContent = 'One';
    const two = document.createElement('option');
    two.value = 'two';
    two.textContent = 'Two';
    select.append(one, two);
    select.value = 'two';
    document.body.append(input, select);

    expect(() => expectBrowser(input).toHaveValue('abc-123')).not.toThrow();
    expect(() => expectBrowser(select).toHaveValue('two')).not.toThrow();
    expect(() => expectBrowser(input).toHaveValue('wrong')).toThrow(
      'Expected element to have matching value',
    );

    expect(() => expectBrowser(input).not.toHaveValue('wrong')).not.toThrow();
    expect(() => expectBrowser(select).not.toHaveValue('two')).toThrow(
      'Expected element to have matching value',
    );
  });

  test('toBeChecked handles checkbox + radio, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const checkedBox = document.createElement('input');
    checkedBox.type = 'checkbox';
    checkedBox.checked = true;

    const uncheckedRadio = document.createElement('input');
    uncheckedRadio.type = 'radio';
    uncheckedRadio.checked = false;

    document.body.append(checkedBox, uncheckedRadio);

    expect(() => expectBrowser(checkedBox).toBeChecked()).not.toThrow();
    expect(() => expectBrowser(uncheckedRadio).toBeChecked()).toThrow(
      'Expected element to be checked',
    );

    expect(() => expectBrowser(uncheckedRadio).not.toBeChecked()).not.toThrow();
    expect(() => expectBrowser(checkedBox).not.toBeChecked()).toThrow(
      'Expected element to be checked',
    );
  });

  test('toHaveFocus checks activeElement, supports .not', () => {
    const {domMatchers} = loadDomMatchers();
    const {createExpect} = loadExpect();
    const expectBrowser = createExpect();
    expectBrowser.extend(domMatchers);

    const input = document.createElement('input');
    const button = document.createElement('button');
    document.body.append(input, button);

    input.focus();

    expect(() => expectBrowser(input).toHaveFocus()).not.toThrow();
    expect(() => expectBrowser(button).toHaveFocus()).toThrow(
      'Expected element to have focus',
    );

    expect(() => expectBrowser(button).not.toHaveFocus()).not.toThrow();
    expect(() => expectBrowser(input).not.toHaveFocus()).toThrow(
      'Expected element to have focus',
    );
  });
});
