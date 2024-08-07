import React, { useState } from 'react';

const Slider = () => {
  const [sliderValue, setSliderValue] = useState(50); // Initial value

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value); // Update state with new value
  };

  return (
    <div>
      <h2>Slider Value: {sliderValue}</h2>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={handleSliderChange}
        className="slider"
      />
    </div>
  );
};

export default Slider;
