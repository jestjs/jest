/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as domQueries from '@testing-library/dom';

type LocatorModule = {
  createLocators: (container: HTMLElement) => {
    getByAltText: (...args: Array<unknown>) => HTMLElement;
    getByLabelText: (...args: Array<unknown>) => HTMLElement;
    getByPlaceholder: (...args: Array<unknown>) => HTMLElement;
    getByRole: (...args: Array<unknown>) => HTMLElement;
    getByTestId: (...args: Array<unknown>) => HTMLElement;
    getByText: (...args: Array<unknown>) => HTMLElement;
    getByTitle: (...args: Array<unknown>) => HTMLElement;
  };
};

jest.mock('@testing-library/dom', () => ({
  getByAltText: jest.fn(),
  getByLabelText: jest.fn(),
  getByPlaceholderText: jest.fn(),
  getByRole: jest.fn(),
  getByTestId: jest.fn(),
  getByText: jest.fn(),
  getByTitle: jest.fn(),
}));

function loadModule(): LocatorModule {
  return require('../../client/tester/locators') as LocatorModule;
}

describe('createLocators', () => {
  const getByAltTextMock = domQueries.getByAltText as unknown as jest.Mock;
  const getByLabelTextMock = domQueries.getByLabelText as unknown as jest.Mock;
  const getByPlaceholderTextMock =
    domQueries.getByPlaceholderText as unknown as jest.Mock;
  const getByRoleMock = domQueries.getByRole as unknown as jest.Mock;
  const getByTestIdMock = domQueries.getByTestId as unknown as jest.Mock;
  const getByTextMock = domQueries.getByText as unknown as jest.Mock;
  const getByTitleMock = domQueries.getByTitle as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 7 getBy* locator methods', () => {
    const {createLocators} = loadModule();

    const locators = createLocators(document.body);

    expect(typeof locators.getByRole).toBe('function');
    expect(typeof locators.getByText).toBe('function');
    expect(typeof locators.getByLabelText).toBe('function');
    expect(typeof locators.getByTestId).toBe('function');
    expect(typeof locators.getByAltText).toBe('function');
    expect(typeof locators.getByPlaceholder).toBe('function');
    expect(typeof locators.getByTitle).toBe('function');
  });

  test('delegates getByRole to @testing-library/dom with container and query args', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('main');
    const target = document.createElement('button');
    getByRoleMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByRole('button', {name: 'Submit'});

    expect(getByRoleMock).toHaveBeenCalledWith(container, 'button', {
      name: 'Submit',
    });
    expect(result).toBe(target);
  });

  test('delegates getByText to @testing-library/dom', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('section');
    const target = document.createElement('p');
    getByTextMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByText('Welcome');

    expect(getByTextMock).toHaveBeenCalledWith(container, 'Welcome');
    expect(result).toBe(target);
  });

  test('delegates getByLabelText to @testing-library/dom', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('form');
    const target = document.createElement('input');
    getByLabelTextMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByLabelText('Email');

    expect(getByLabelTextMock).toHaveBeenCalledWith(container, 'Email');
    expect(result).toBe(target);
  });

  test('delegates getByTestId to @testing-library/dom', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('div');
    const target = document.createElement('span');
    getByTestIdMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByTestId('card-title');

    expect(getByTestIdMock).toHaveBeenCalledWith(container, 'card-title');
    expect(result).toBe(target);
  });

  test('delegates getByAltText to @testing-library/dom', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('div');
    const target = document.createElement('img');
    getByAltTextMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByAltText('Avatar');

    expect(getByAltTextMock).toHaveBeenCalledWith(container, 'Avatar');
    expect(result).toBe(target);
  });

  test('delegates getByPlaceholder to @testing-library/dom getByPlaceholderText', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('div');
    const target = document.createElement('input');
    getByPlaceholderTextMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByPlaceholder('Search...');

    expect(getByPlaceholderTextMock).toHaveBeenCalledWith(
      container,
      'Search...',
    );
    expect(result).toBe(target);
  });

  test('delegates getByTitle to @testing-library/dom', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('div');
    const target = document.createElement('abbr');
    getByTitleMock.mockReturnValue(target);

    const locators = createLocators(container);
    const result = locators.getByTitle('Tooltip title');

    expect(getByTitleMock).toHaveBeenCalledWith(container, 'Tooltip title');
    expect(result).toBe(target);
  });

  test('propagates @testing-library/dom thrown error', () => {
    const {createLocators} = loadModule();
    const container = document.createElement('div');
    const error = new Error('Unable to find role="button"');
    getByRoleMock.mockImplementation(() => {
      throw error;
    });

    const locators = createLocators(container);

    expect(() => locators.getByRole('button')).toThrow(
      'Unable to find role="button"',
    );
  });
});
