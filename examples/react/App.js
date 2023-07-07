//parent component
import {useRef} from 'react';
import CheckboxWithLabel from './CheckboxWithLabel';

export default function App() {
  const labelRef = useRef(null);
  const inputRef = useRef(null);
  const labelOn = 'on';
  const labelOff = 'off';

  return (
    <div>
      <CheckboxWithLabel        
        labelRef={labelRef}        
        inputRef={inputRef} 
        labelOn={labelOn} 
        labelOff={labelOff}/>
    </div>
  );
}
