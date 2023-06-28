//parent component
import CheckboxWithLabel from "./CheckboxWithLabel";

export default function App(){
let labelOn ='on'
let labelOff='off'

return(
    <div>
        <CheckboxWithLabel labelOn={labelOn} labelOff={labelOff}/>
    </div>
)


}
