import React, { Component } from 'react';
import './App.css';
import ConnectionDialog from './ConnectionDialog';

class App extends Component {
  render() {
    return (
      <div className="App">
        <ConnectionDialog/>
      </div>
    );
  }
}

export default App;
