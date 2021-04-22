// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import * as React from 'react';
import * as TestUtils from 'react-dom/test-utils';

const CheckboxWithLabel = require('../CheckboxWithLabel').default;

it('CheckboxWithLabel changes the text after click', () => {
  const checkboxLabelRef: React.RefObject<HTMLLabelElement> = React.createRef();
  const checkboxInputRef: React.RefObject<HTMLInputElement> = React.createRef();
  // Render a checkbox with label in the document
  TestUtils.renderIntoDocument(
    <CheckboxWithLabel
      labelRef={checkboxLabelRef}
      inputRef={checkboxInputRef}
      labelOn="On"
      labelOff="Off"
    />,
  );

  const labelNode = checkboxLabelRef.current;
  const inputNode = checkboxInputRef.current;

  // Verify that it's Off by default
  expect(labelNode.textContent).toEqual('Off');

  // Simulate a click and verify that it is now On
  TestUtils.Simulate.change(inputNode);
  expect(labelNode.textContent).toEqual('On');
});
