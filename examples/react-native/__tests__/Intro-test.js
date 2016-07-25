/**
 * Sample React Native Snapshot Test
 */
'use strict';

import React from 'react';
import Intro from '../Intro';
import renderer from 'react/lib/ReactTestRenderer';

describe('Intro', () => {

  it('renders correctly', () => {
    const tree = renderer.create(
      <Intro />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

});
