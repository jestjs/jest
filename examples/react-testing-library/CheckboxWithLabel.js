// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import {useState} from 'react';

export default function CheckboxWithLabel({labelOn, labelOff}) {
  const [isChecked, setIsChecked] = useState(false);

  const onChange = () => {
    setIsChecked(draft => !draft);
  };

  return (
    <label>
      <input type="checkbox" checked={isChecked} onChange={onChange} />
      {isChecked ? labelOn : labelOff}
    </label>
  );
}
