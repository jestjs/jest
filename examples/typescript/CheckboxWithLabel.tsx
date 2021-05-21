// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import * as React from 'react';

type CheckboxWithLabelProps = {
  labelRef: React.LegacyRef<HTMLLabelElement>;
  inputRef: React.LegacyRef<HTMLInputElement>;
  labelOff: string;
  labelOn: string;
};

const CheckboxWithLabel = ({
  labelRef,
  inputRef,
  labelOn,
  labelOff,
}: CheckboxWithLabelProps) => {
  const [isChecked, setIsChecked] = React.useState(false);

  const onChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <label ref={labelRef}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
      />
      {isChecked ? labelOn : labelOff}
    </label>
  );
};

export default CheckboxWithLabel;
