
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import { GoogleOAuthProvider } from '@react-oauth/google' 
import { AuthProvider } from './context/AuthProvider.jsx'

// To ensure Leaflet works properly in Vite + React 18 environment, 
// we need to expose the Leaflet library globally. 
// This is a common workaround for compatibility issues with Leaflet's 
// reliance on global variables. By assigning Leaflet to `window.L`, 
// we allow it to function correctly within our React application without
// running into issues related to module imports or strict mode in React 18.
import L from 'leaflet'
window.L = L

import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
)