import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import Accordion from './Accordian';
import './Navbar.css';
import { IconContext } from 'react-icons';


const Navbar = ({ onExportClick, onDownloadCSV }) => {
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
      onClick: onDownloadCSV
    },
    { 
      label: "Download SVG", 
      onClick: onExportClick
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
          <FaIcons.FaBars onClick={showSidebar} style={{ fontSize: '24px', cursor: 'pointer' }} />
        </div>
        </IconContext.Provider>
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
          <ul className='nav-menu-items'>
            <li className='navbar-toggle' onClick={showSidebar}>
            <IconContext.Provider value={{ color: '#fff' }}>
              <AiIcons.AiOutlineClose style={{ cursor: 'pointer' }} />
              </IconContext.Provider>
            </li>

            {/* Add Accordion to Sidebar */}
            <li className='accordion-section'>
              <Accordion items={data} />
            </li>
          </ul>
        </nav>
    </>
  );
}

export default Navbar;
