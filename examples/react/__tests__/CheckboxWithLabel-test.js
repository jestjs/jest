// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import {act, createRef} from 'react';
import {createRoot} from 'react-dom/client';
import CheckboxWithLabel from '../CheckboxWithLabel';

it('CheckboxWithLabel changes the text after click', () => {
  const checkboxLabelRef = createRef();
  const checkboxInputRef = createRef();
  // Render a checkbox with label in the document
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <CheckboxWithLabel
        labelRef={checkboxLabelRef}
        inputRef={checkboxInputRef}
        labelOn="On"
        labelOff="Off"
      />,
    );
  });

  const labelNode = checkboxLabelRef.current;
  const inputNode = checkboxInputRef.current;

  // Verify that it's Off by default
  expect(labelNode.textContent).toBe('Off');

  // Simulate a click and verify that it is now On
  act(() => {
    inputNode.click();
  });
  expect(labelNode.textContent).toBe('On');
});
