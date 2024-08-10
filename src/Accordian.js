import React, { useState } from 'react';
import './Accordian.css'; 
import { useSlider } from './SliderContext'; 

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = index => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { sliderValue, setSliderValue, aERSliderValue ,setaERSliderValue,iERSliderValue,setIERSliderValue,rERSliderValue, setrERSliderValue,atomicSliderValue, setatomicSliderValue} = useSlider();
  

  
  const handleSliderChange = (e) => {
      setSliderValue(e.target.value); // Update context with new value
    };

    const handleSliderChange2 = (e) => {
      setaERSliderValue(e.target.value); // Update context with new value
    };

    const handleSliderChange3 = (e) => {
      setIERSliderValue(e.target.value); // Update context with new value
    };

    const handleSliderChange4 = (e) => {
      setrERSliderValue(e.target.value); // Update context with new value
    };

    const handleSliderChange5 = (e) => {
      setatomicSliderValue(e.target.value); // Update context with new value
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
              <p>Resize All Nodes</p>
              <input
                type="range"
                min={item.min}
                max={item.max}
                value={sliderValue}
                onChange={handleSliderChange}
                className="slider"
              />

            <p>Resize aERs</p>
              <input
                type="range"
                min={0}
                max={20}
                value={aERSliderValue}
                onChange={handleSliderChange2}
                className="slider"
              />

            <p>Resize iERs</p>
              <input
                type="range"
                min={0}
                max={20}
                value={iERSliderValue}
                onChange={handleSliderChange3}
                className="slider"
              />
              
            <p>Resize rERs</p>
              <input
                type="range"
                min={0}
                max={20}
                value={rERSliderValue}
                onChange={handleSliderChange4}
                className="slider"
              />

              <p>Resize Atomic ERs</p>
              <input
                type="range"
                min={0}
                max={20}
                value={atomicSliderValue}
                onChange={handleSliderChange5}
                className="slider"
              />

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
