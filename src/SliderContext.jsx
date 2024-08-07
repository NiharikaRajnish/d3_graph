import React, { createContext, useState, useContext } from 'react';

const SliderContext = createContext();

const SliderProvider = ({ children }) => {
  const [sliderValue, setSliderValue] = useState(7); // Default value
  const nodeSize = Math.max(10, sliderValue);

  return (
    <SliderContext.Provider value={{ sliderValue, setSliderValue }}>
      {children}
    </SliderContext.Provider>
  );
};

// Custom hook for easy access to the context
const useSlider = () => {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('useSlider must be used within a SliderProvider');
  }
  return context;
};

export { SliderProvider, useSlider };
