import React from 'react';
import '../../roundedbutton.css'; // Updated path

const RoundedButton = ({ children, onClick, style }) => {
  return (
    <button className="rounded-button" onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export default RoundedButton;
