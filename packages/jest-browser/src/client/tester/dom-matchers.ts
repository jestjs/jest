/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type MatcherResult = {
  message: () => string;
  pass: boolean;
};

function isElement(value: unknown): value is Element {
  return value instanceof Element;
}

function createResult(pass: boolean, message: string): MatcherResult {
  return {
    message: () => message,
    pass,
  };
}

function toReadable(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function createDomMatchers(): {
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
} {
  return {
    toBeChecked(received: unknown): MatcherResult {
      const pass =
        received instanceof HTMLInputElement
          ? Boolean(received.checked)
          : false;

      return createResult(pass, 'Expected element to be checked');
    },

    toBeEnabled(received: unknown): MatcherResult {
      const pass =
        received instanceof HTMLButtonElement ||
        received instanceof HTMLInputElement ||
        received instanceof HTMLSelectElement ||
        received instanceof HTMLTextAreaElement ||
        received instanceof HTMLOptionElement ||
        received instanceof HTMLOptGroupElement ||
        received instanceof HTMLFieldSetElement
          ? !received.disabled
          : false;

      return createResult(pass, 'Expected element to be enabled');
    },

    toBeInTheDocument(received: unknown): MatcherResult {
      const pass =
        isElement(received) &&
        received.ownerDocument?.contains(received) === true;

      return createResult(pass, 'Expected element to be in document');
    },

    toBeVisible(received: unknown): MatcherResult {
      if (!isElement(received)) {
        return createResult(false, 'Expected element to be visible');
      }

      const style =
        received.ownerDocument.defaultView?.getComputedStyle(received);
      const pass =
        !received.hasAttribute('hidden') &&
        (style?.display ?? '') !== 'none' &&
        (style?.visibility ?? '') !== 'hidden' &&
        (style?.opacity ?? '') !== '0';

      return createResult(pass, 'Expected element to be visible');
    },

    toHaveAttribute(
      received: unknown,
      name: unknown,
      value?: unknown,
    ): MatcherResult {
      if (!isElement(received) || typeof name !== 'string') {
        return createResult(false, 'Expected element to have attribute');
      }

      const hasAttr = received.hasAttribute(name);
      if (value === undefined) {
        return createResult(
          hasAttr,
          `Expected element to have attribute ${name}`,
        );
      }

      const expectedValue = toReadable(value);
      const pass = hasAttr && received.getAttribute(name) === expectedValue;
      return createResult(
        pass,
        `Expected element to have attribute ${name} with value ${expectedValue}`,
      );
    },

    toHaveClass(
      received: unknown,
      ...classNames: Array<unknown>
    ): MatcherResult {
      if (!isElement(received)) {
        return createResult(false, 'Expected element to have class');
      }

      const pass = classNames.every(className =>
        typeof className === 'string'
          ? received.classList.contains(className)
          : false,
      );

      return createResult(pass, 'Expected element to have requested classes');
    },

    toHaveFocus(received: unknown): MatcherResult {
      const pass =
        isElement(received) &&
        received.ownerDocument?.activeElement === received;

      return createResult(pass, 'Expected element to have focus');
    },

    toHaveTextContent(received: unknown, expected: unknown): MatcherResult {
      if (!isElement(received)) {
        return createResult(false, 'Expected element to have text content');
      }

      const text = received.textContent ?? '';
      const pass =
        expected instanceof RegExp
          ? expected.test(text)
          : text.includes(String(expected));

      return createResult(
        pass,
        'Expected element to have matching text content',
      );
    },

    toHaveValue(received: unknown, expected?: unknown): MatcherResult {
      if (!isElement(received)) {
        return createResult(false, 'Expected element to have value');
      }

      let value: unknown;
      if (received instanceof HTMLSelectElement) {
        if (received.multiple) {
          value = [...received.selectedOptions].map(option => option.value);
        } else {
          value = received.value;
        }
      } else if (
        received instanceof HTMLInputElement ||
        received instanceof HTMLTextAreaElement ||
        received instanceof HTMLOptionElement
      ) {
        value = received.value;
      } else {
        return createResult(false, 'Expected element to have value');
      }

      const pass =
        expected === undefined
          ? value !== undefined
          : toReadable(value) === toReadable(expected);

      return createResult(pass, 'Expected element to have matching value');
    },
  };
}

export const domMatchers = createDomMatchers();
