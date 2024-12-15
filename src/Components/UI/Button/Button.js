import React, { useState } from "react";
import "./Button.scss";

const Button = ({ type, color, text, onClick }) => {
  const [isActive, setIsActive] = useState(false);

  const handleMouseDown = () => {
    setIsActive(true);
  };

  const handleMouseUp = () => {
    setIsActive(false);
  };

  const handleMouseLeave = () => {
    setIsActive(false);
  };

  const buttonClass = `button ${isActive ? "button-active" : ""} ${
    type === "run"
      ? "button-run"
      : type === "del"
      ? "button-del"
      : "button-other"
  }`;

  let buttonStyle = {};
  if (type === "run") {
    buttonStyle = {
      backgroundColor: "green",
      color: "white",
    };
  } else if (type === "del") {
    buttonStyle = { backgroundColor: "red", color: "white" };
  } else {
    buttonStyle = { backgroundColor: color, color: "white" };
  }

  return (
    <div className="button-wrapper">
      <button
        className={buttonClass}
        style={buttonStyle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={onClick} // Обработка клика
      >
        {type === "run" && "Run"}
        {type === "del" && "Clear"}
        {type === "other" && text}
      </button>
    </div>
  );
};

export default Button;
