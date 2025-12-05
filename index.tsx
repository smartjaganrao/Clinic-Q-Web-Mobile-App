import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { seedMockDataIfFirstLoad } from './src/services/mockData';

// Seed localStorage with mock data on first load
seedMockDataIfFirstLoad();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);