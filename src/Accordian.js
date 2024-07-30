import React, { useState } from 'react';
import './Accordian.css'; // Update or create your own styles if needed

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = index => {
    setOpenIndex(openIndex === index ? null : index);
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
              <img src={item.image} className='accordion-image' />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Accordion;
