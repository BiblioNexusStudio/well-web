import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import AudioPlayer from './components/AudioPlayer';

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
        <AudioPlayer url="https://kyletestingaquifer.blob.core.windows.net/mp3s/2%20-%20Setting%20the%20Stage%20(medium).mp3" />
      </header>
    </div>
  );
}

export default App;
