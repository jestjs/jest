/// <reference path="./typings/react/react.d.ts" />

import * as React from 'react'

interface CheckboxWithLabelProps extends React.Props<any> {
  labelOff: string;
  labelOn: string;
}

var CheckboxWithLabel = React.createClass<CheckboxWithLabelProps, any>( {
  getInitialState: function() {
    return {isChecked: false}
  },
  onChange: function() {
    this.setState({isChecked: !this.state.isChecked});
  },

  render: function() {
    return (
      <label>
        <input
          type="checkbox"
          checked={this.state.isChecked}
          onChange={this.onChange}
        />
        {this.state.isChecked ? this.props.labelOn : this.props.labelOff}
      </label>
    );
  }
});

export = CheckboxWithLabel;
