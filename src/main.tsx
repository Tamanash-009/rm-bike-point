import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import ThemedClerkProvider from './components/ThemedClerkProvider.tsx';
import App from './App.tsx';
import './index.css';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Use a structurally valid fallback key (base64 clerk.example.com$) so Clerk initializes safely without crashing
const FALLBACK_KEY = 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k';

if (!PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Running in preview/demo mode.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedClerkProvider publishableKey={PUBLISHABLE_KEY || FALLBACK_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemedClerkProvider>
    </ThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
