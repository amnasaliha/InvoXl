import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// API Base URL config for deployment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
axios.defaults.baseURL = API_URL;
window.API_BASE_URL = API_URL; // Accessible for native fetch calls

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);