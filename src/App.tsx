import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [html, setHtml] = useState('');
  useEffect(() => {
    fetch('https://kyletesting.azurewebsites.net/')
      .then((r) => r.text())
      .then((t) => setHtml(t));
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        {html}
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
