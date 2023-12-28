// Copyright (c) Meta Platforms, Inc. and affiliates.

import {useState} from 'react';

type CheckboxWithLabelProps = {
  labelRef: React.LegacyRef<HTMLLabelElement>;
  inputRef: React.LegacyRef<HTMLInputElement>;
  labelOff: string;
  labelOn: string;
};

export default function CheckboxWithLabel({
  labelRef,
  inputRef,
  labelOn,
  labelOff,
}: CheckboxWithLabelProps) {
  const [isChecked, setIsChecked] = useState(false);

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
}
