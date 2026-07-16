/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {plugins} from '../';
import setPrettyPrint from './setPrettyPrint';

const {ReactElement} = plugins;

setPrettyPrint([ReactElement]);

describe('ReactElement Plugin', () => {
  let forwardRefComponent: {
    (_props: unknown, _ref: unknown): React.ReactElement | null;
    displayName?: string;
  };

  let forwardRefExample: ReturnType<typeof React.forwardRef>;

  beforeEach(() => {
    forwardRefComponent = (_props, _ref) => null;

    forwardRefExample = React.forwardRef(forwardRefComponent);

    forwardRefExample.displayName = undefined;
  });

  test('serializes forwardRef without displayName', () => {
    forwardRefExample = React.forwardRef((_props, _ref) => null);
    expect(React.createElement(forwardRefExample)).toPrettyPrintTo(
      '<ForwardRef />',
    );
  });

  test('serializes forwardRef with displayName', () => {
    forwardRefExample.displayName = 'Display';
    expect(React.createElement(forwardRefExample)).toPrettyPrintTo(
      '<Display />',
    );
  });

  test('serializes forwardRef component with displayName', () => {
    forwardRefComponent.displayName = 'Display';
    expect(React.createElement(forwardRefExample)).toPrettyPrintTo(
      '<ForwardRef(Display) />',
    );
  });
});
