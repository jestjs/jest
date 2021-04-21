import React, {useState} from 'react';

const STATUS = {
  HOVERED: 'hovered',
  NORMAL: 'normal',
};

const Link = ({page, children}) => {
  const [className, setClassName] = useState(STATUS.NORMAL);

  const onMouseEnter = () => {
    setClassName(STATUS.HOVERED);
  };

  const onMouseLeave = () => {
    setClassName(STATUS.NORMAL);
  };

  return (
    <a
      className={className}
      href={page || '#'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </a>
  );
};

export default Link;
