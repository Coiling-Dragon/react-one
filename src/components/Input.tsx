// Input.tsx
import React from "react";

interface IProps {
  placeholder: string;
  type: string;
  name: string;
  id: string;
  value?: string;
  handleChange: (string:string)=>void;
}

const Input = (props: IProps) => {
  // const [term, setTerm] = useState("");
  // (e) => setTerm(e.target.value)

  const changeHandler = (event:any) => {
    let changeVal:string;
    changeVal = event.target.value;
    props.handleChange(changeVal)
  };
  
  return (
    <input
      name={props.name}
      id={props.id}
      type={props.type}
      placeholder={props.placeholder}
      value={props.value}
      onChange={changeHandler}
    />
  );
};

export default Input;
