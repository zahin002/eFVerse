import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

axios.defaults.withCredentials = true;

// Support dynamic backend URL when deployed (e.g., Render / Railway)
const deployedBackend = import.meta.env.VITE_API_BASE_URL;
if (deployedBackend) {
  const targetBase = deployedBackend.replace(/\/$/, '');
  axios.interceptors.request.use((config) => {
    if (config.url && config.url.startsWith('http://localhost:5001')) {
      config.url = config.url.replace('http://localhost:5001', targetBase);
    }
    return config;
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)