/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  getByAltText,
  getByLabelText,
  getByPlaceholderText,
  getByRole,
  getByTestId,
  getByText,
  getByTitle,
} from '@testing-library/dom';

type QueryArgs<T extends (...args: Array<any>) => unknown> = T extends (
  container: HTMLElement,
  ...args: infer R
) => unknown
  ? R
  : never;

export function createLocators(container: HTMLElement): {
  getByAltText: (...args: QueryArgs<typeof getByAltText>) => HTMLElement;
  getByLabelText: (...args: QueryArgs<typeof getByLabelText>) => HTMLElement;
  getByPlaceholder: (
    ...args: QueryArgs<typeof getByPlaceholderText>
  ) => HTMLElement;
  getByRole: (...args: QueryArgs<typeof getByRole>) => HTMLElement;
  getByTestId: (...args: QueryArgs<typeof getByTestId>) => HTMLElement;
  getByText: (...args: QueryArgs<typeof getByText>) => HTMLElement;
  getByTitle: (...args: QueryArgs<typeof getByTitle>) => HTMLElement;
} {
  return {
    getByAltText: (...args: QueryArgs<typeof getByAltText>) =>
      getByAltText(container, ...args),
    getByLabelText: (...args: QueryArgs<typeof getByLabelText>) =>
      getByLabelText(container, ...args),
    getByPlaceholder: (...args: QueryArgs<typeof getByPlaceholderText>) =>
      getByPlaceholderText(container, ...args),
    getByRole: (...args: QueryArgs<typeof getByRole>) =>
      getByRole(container, ...args),
    getByTestId: (...args: QueryArgs<typeof getByTestId>) =>
      getByTestId(container, ...args),
    getByText: (...args: QueryArgs<typeof getByText>) =>
      getByText(container, ...args),
    getByTitle: (...args: QueryArgs<typeof getByTitle>) =>
      getByTitle(container, ...args),
  };
}
