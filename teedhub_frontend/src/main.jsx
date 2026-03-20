import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // Import i18n configuration

// Import shadcn globals and other styles
import './styles/globals.css'
import './index.css'

import App from './App.jsx'

import './i18n' // Import i18n configuration

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("VITE_NODE_ENV:", import.meta.env.VITE_NODE_ENV);