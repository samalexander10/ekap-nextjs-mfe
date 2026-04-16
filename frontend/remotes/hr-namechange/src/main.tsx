import React from 'react';
import ReactDOM from 'react-dom/client';
import NameChangeApp from './NameChangeApp';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><NameChangeApp onComplete={(id) => console.log('Complete:', id)} /></React.StrictMode>
);
