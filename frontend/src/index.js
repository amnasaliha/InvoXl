import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// API Base URL config for deployment
// API Base URL config for deployment
const isProd = process.env.NODE_ENV === 'production';
const API_URL = process.env.REACT_APP_API_URL || (isProd ? window.location.origin : 'http://localhost:5001');
axios.defaults.baseURL = API_URL;
// Native fetch calls will use process.env.REACT_APP_API_URL || 'http://localhost:5001'

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);