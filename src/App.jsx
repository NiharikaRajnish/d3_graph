import React from 'react';
import NetworkGraph from './NetworkGraph';
import Navbar from './Navbar';
import { SliderProvider } from './SliderContext';
import './App.css';

const App = () => {
    return (
        <div className="App">
             <SliderProvider>
            <NetworkGraph />
            </SliderProvider>
        </div>
    );
};

export default App;
