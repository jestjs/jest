// Copyright 2004-present Facebook. All Rights Reserved.
/* eslint-disable no-unused-vars */

'use strict';

const React = require('react');
const Link = require('../Link.react');
const renderer = require('react/lib/ReactTestRenderer');

describe('Link', () => {

  it('renders correctly', () => {
    const tree = renderer.create(
      <Link page="http://www.example.com">HI</Link>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders as an anchor when no page is set', () => {
    const tree = renderer.create(
      <Link>HI</Link>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('changes the class when hovered', () => {
    const component = renderer.create(
      <Link page="http://www.example.com">HI</Link>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseEnter();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseLeave();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

  });

});
