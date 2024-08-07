import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import Accordion from './Accordian';
import './Navbar.css';
import { IconContext } from 'react-icons';


const Navbar = ({ onAction }) => {
  const [sidebar, setSidebar] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const showSidebar = () => setSidebar(!sidebar);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);



  let data = [
    {
        name: "Show Legend",
        type: 'image',
        image: "https://docs.google.com/drawings/d/e/2PACX-1vS01U41gDzYPLY-O7ysppcy_Z13PtUnt9p-eKzvmNHm6IJ2UZqCJfZURNdRrg8MF_nWYci3UGNqcup4/pub?w=872&amp;h=602"
      
},{
  name: "Share",
  type: 'buttons',
  content: [
    { 
      label: "Download CSV", 
      onClick: onAction
    },
    { 
      label: "Download SVG", 
      onClick: () => { 
        // Your logic to download SVG
        console.log("Download SVG clicked");
      }
    }
]
},
{
  name: "Adjust Node Sizes",
  type: 'slider',
  min: 0,           
  max: 20,        
  value: 7,        
},


]



  return (
    <>
      <IconContext.Provider value={{ color: '#000' }}>
        <div className='navbar'>
          <FaIcons.FaBars onClick={showSidebar} style={{ fontSize: '24px' }} />
        </div>
        </IconContext.Provider>
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
          <ul className='nav-menu-items'>
            <li className='navbar-toggle' onClick={showSidebar}>
            <IconContext.Provider value={{ color: '#fff' }}>
              <AiIcons.AiOutlineClose />
              </IconContext.Provider>
            </li>

            {/* Add Accordion to Sidebar */}
            <li className='accordion-section'>
              <Accordion items={data} />
            </li>



            {/* <li className='nav-menu-item'>
              <div className='dropdown-toggle' onClick={toggleDropdown}>
                <span>Show Legend</span>
              </div>
              <div className={dropdownOpen ? 'dropdown open' : 'dropdown'}>
                <img src='./legend.PNG' alt="Legend" className="legend-image" />
              </div>
            </li> */}

            
          </ul>
        </nav>

    </>
  );
}

export default Navbar;
