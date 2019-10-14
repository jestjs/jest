// Copyright 2004-present Facebook. All Rights Reserved.

import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import * as TestUtils from 'react-dom/test-utils';
import CheckboxWithLabel from '../CheckboxWithLabel';

it('CheckboxWithLabel changes the text after click', () => {
  // Render a checkbox with label in the document
  const checkboxNodeRefRef = useRef(null);

  const checkbox = TestUtils.renderIntoDocument(
    <CheckboxWithLabel ref={checkboxNodeRefRef} labelOn="On" labelOff="Off" />
  );

  // Verify that it's Off by default
  expect(checkboxNodeRef.current.textContent).toEqual('Off');

  // Simulate a click and verify that it is now On
  TestUtils.Simulate.change(
    TestUtils.findRenderedDOMComponentWithTag(checkbox, 'input')
  );
  expect(checkboxNodeRef.current.textContent).toEqual('On');
});
