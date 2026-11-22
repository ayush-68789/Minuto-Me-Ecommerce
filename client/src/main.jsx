import { DEMO } from './demo/mockApi.js'; // must be first: installs the demo API adapter before any axios.create()
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

if (DEMO) document.documentElement.dataset.demo = 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
