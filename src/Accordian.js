import React, { useState } from 'react';
import './Accordian.css'; 
import Slider from './Slider'
import { useSlider } from './SliderContext'; 

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = index => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { sliderValue, setSliderValue } = useSlider();
  
  const handleSliderChange = (e) => {
      setSliderValue(e.target.value); // Update context with new value
    };
  

  const renderContent = item => {
    console.log(item.type)
    switch (item.type) {
      case 'image':
        return <img src={item.image} className='accordion-image' alt='Accordion content' />;
      case 'buttons':
        return (
          <div className='accordion-buttons'>
            {item.content.map((button, idx) => (
              <button key={idx} onClick={button.onClick}>
                {button.label}
              </button>
            ))}
          </div>
        );
      case 'slider':
        return (
              <div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                value={sliderValue}
                onChange={handleSliderChange}
                className="slider"
              />
              <p>Slider Value: {sliderValue}</p>
            </div>



        );
      default:
        return null;
    }
  };

  return (
    <div className='accordion'>
      {items.map((item, index) => (
        <div key={index} className='accordion-item'>
          <div className='accordion-title' onClick={() => toggleAccordion(index)}>
            {item.name}
          </div>
          {openIndex === index && (
            <div className='accordion-content'>
              {renderContent(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Accordion;
