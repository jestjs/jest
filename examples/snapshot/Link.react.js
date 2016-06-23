// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';
const React = require('react');

const STATUS = {
  NORMAL: 'normal',
  HOVERED: 'hovered',
};

class Link extends React.Component {

  constructor() {
    super();
    this.state = {
      class: STATUS.NORMAL,
    };
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
  }

  _onMouseEnter() {
    this.setState({class: STATUS.HOVERED});
  }

  _onMouseLeave() {
    this.setState({class: STATUS.NORMAL});
  }

  render() {
    return (
      <a
        className={this.state.class}
        href={this.props.page || '#'}
        onMouseEnter={this._onMouseEnter}
        onMouseLeave={this._onMouseLeave}
        >
          {this.props.children}
      </a>
    );
  }

}

module.exports = Link;
