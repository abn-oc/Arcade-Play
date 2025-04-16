import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId='510655184245-s2fms5kr69plv8vi5t416lfv5u945rl8.apps.googleusercontent.com'>
    <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
    </StrictMode>,
  </GoogleOAuthProvider>
)
