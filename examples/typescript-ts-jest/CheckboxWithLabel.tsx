// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import * as React from 'react';

interface CheckboxWithLabelProps {
  labelRef: React.LegacyRef<HTMLLabelElement>;
  inputRef: React.LegacyRef<HTMLInputElement>;
  labelOff: string;
  labelOn: string;
}

interface CheckboxWithLabelState {
  isChecked: boolean;
}

class CheckboxWithLabel extends React.Component<
  CheckboxWithLabelProps,
  CheckboxWithLabelState
> {
  constructor(props: CheckboxWithLabelProps) {
    super(props);
    this.state = {isChecked: false};
  }

  render() {
    return (
      <label ref={this.props.labelRef}>
        <input
          ref={this.props.inputRef}
          type="checkbox"
          checked={this.state.isChecked}
          onChange={() =>
            this.setState(current => ({isChecked: !current.isChecked}))
          }
        />
        {this.state.isChecked ? this.props.labelOn : this.props.labelOff}
      </label>
    );
  }
}

export default CheckboxWithLabel;
