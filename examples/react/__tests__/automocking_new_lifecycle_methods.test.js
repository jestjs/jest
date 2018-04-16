// Copyright 2004-present Facebook. All Rights Reserved.

/* eslint-disable no-unused-vars */

jest.mock('../ProcessedDataComponent');

import React from 'react';
import ReactDOM from 'react-dom';
import * as TestUtils from 'react-dom/test-utils';
import ProcessedDataComponent from '../ProcessedDataComponent';

// ProccessedDataComponent uses 'getDerivedStateFromProps'

class Wrapper extends React.Component {
  render() {
    // ProcessedDataComponent is mocked out.
    return (
      <div>
        <ProcessedDataComponent data={[1, 2, 3]} />
      </div>
    );
  }
}

it('should render a mocked component containing gDSFP with ReactShallowRenderer', () => {
  const render = () => TestUtils.renderIntoDocument(<Wrapper />);
  expect(render).not.toThrow();
});
