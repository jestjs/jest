/// <reference path="../typings/react/react.d.ts" />
/// <reference path="../typings/react/react-dom.d.ts" />
/// <reference path="../typings/jest/jest.d.ts" />

//declare var jest:any;
/*
tsc -w -t ES5 --jsx react  -m commonjs --outDir __built\__test__ .\__tests__\CheckboxWithLabel-test.tsx

*/

//import * as jest from 'jest-cli'; never import jest

jest.dontMock('../CheckboxWithLabel')

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as TestUtils from 'react-addons-test-utils';

const CheckboxWithLabel = require('../CheckboxWithLabel');

describe('CheckboxWithLabel', () => {

  it('changes the text after click', () => {

    // Render a checkbox with label in the document
    var checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    var checkboxNode = ReactDOM.findDOMNode(checkbox);

    // Verify that it's Off by default
    expect(checkboxNode.textContent).toEqual('Off');

    // Simulate a click and verify that it is now On
    TestUtils.Simulate.change(TestUtils.findRenderedDOMComponentWithTag(checkbox, 'input'));
    expect(checkboxNode.textContent).toEqual('On');
  });
});
